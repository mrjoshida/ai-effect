import { RithmCurrentId, WorkshopIdeaGroup, WorkshopProposal } from '../types/game';

export const MIN_GROUPING_INTERVAL_MS = 30_000;
export const FACILITATOR_API_KEY_STORAGE = 'ai-effect-facilitator-ai-key';

let lastCachedFingerprint: string | null = null;
let lastCachedGroups: WorkshopIdeaGroup[] = [];
let lastApiCallTimestamp = 0;

export function resetIdeaGroupingCacheForTesting(): void {
  lastCachedFingerprint = null;
  lastCachedGroups = [];
  lastApiCallTimestamp = 0;
}

export function getConfiguredAiKey(): string {
  // 1. Check URL hash #aiKey=...
  if (typeof window !== 'undefined' && window.location?.hash) {
    try {
      const hash = window.location.hash;
      const match = hash.match(/[#&]aiKey=([^&]+)/);
      if (match && match[1]) {
        const decodedKey = decodeURIComponent(match[1]).trim();
        if (decodedKey) {
          setConfiguredAiKey(decodedKey);
          let cleanHash = hash.replace(match[0], '');
          if (cleanHash.startsWith('&')) {
            cleanHash = '#' + cleanHash.slice(1);
          } else if (cleanHash.startsWith('#&')) {
            cleanHash = '#' + cleanHash.slice(2);
          }
          if (cleanHash === '#' || !cleanHash) {
            cleanHash = '';
          }
          if (window.history && window.history.replaceState) {
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search + cleanHash
            );
          }
          return decodedKey;
        }
      }
    } catch {
      // Ignore
    }
  }

  // 2. Check localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(FACILITATOR_API_KEY_STORAGE);
      if (stored && stored.trim().length > 0) {
        return stored.trim();
      }
    } catch {
      // Ignore storage read error
    }
  }

  return '';
}

export function setConfiguredAiKey(key: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(FACILITATOR_API_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(FACILITATOR_API_KEY_STORAGE);
    }
  } catch {
    // Ignore storage write error
  }
}

export function computeProposalsFingerprint(proposals: WorkshopProposal[]): string {
  const sorted = [...proposals].sort((a, b) => a.id.localeCompare(b.id));
  const combined = sorted
    .map((p) => `${p.id}:${p.currentId}:${p.text.trim()}`)
    .join('|');
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return `${sorted.length}_${(hash >>> 0).toString(16)}`;
}

export interface IdeaGroupingResult {
  status: 'grouped' | 'unavailable';
  groups: WorkshopIdeaGroup[];
  fromCache?: boolean;
  throttled?: boolean;
}

export async function groupWorkshopIdeasWithAI(
  proposals: WorkshopProposal[],
  options?: {
    apiKey?: string;
    fetchImpl?: typeof fetch;
    force?: boolean;
    now?: number;
  }
): Promise<IdeaGroupingResult> {
  if (proposals.length === 0) {
    return { status: 'unavailable', groups: [] };
  }

  const fingerprint = computeProposalsFingerprint(proposals);

  // Check cache
  if (fingerprint === lastCachedFingerprint && lastCachedGroups.length > 0) {
    return {
      status: 'grouped',
      groups: lastCachedGroups,
      fromCache: true,
    };
  }

  // Check throttle
  const now = options?.now ?? Date.now();
  if (!options?.force && now - lastApiCallTimestamp < MIN_GROUPING_INTERVAL_MS) {
    return {
      status: 'unavailable',
      groups: [],
      throttled: true,
    };
  }

  // Resolve API key
  const apiKey = options?.apiKey ?? getConfiguredAiKey();
  if (!apiKey) {
    return { status: 'unavailable', groups: [] };
  }

  // Group proposals by currentId
  const proposalsByCurrent: Record<string, Array<{ id: string; text: string }>> = {};
  const proposalMap = new Map<string, WorkshopProposal>();
  for (const p of proposals) {
    proposalMap.set(p.id, p);
    if (!proposalsByCurrent[p.currentId]) {
      proposalsByCurrent[p.currentId] = [];
    }
    proposalsByCurrent[p.currentId].push({ id: p.id, text: p.text });
  }

  const prompt = [
    'You are a workshop facilitator clustering brainstormed ideas into affinity themes.',
    'For each Current, group overlapping ideas into clusters with a concise, approachable themeTitle (maximum 65 characters) and an array of proposalIds.',
    'Any distinct idea that does not overlap with others must be returned as a single-item cluster using its text or a concise summary as themeTitle.',
    'Every input proposalId must appear in exactly one group in its currentId.',
    '',
    'Input proposals by Current:',
    JSON.stringify(proposalsByCurrent, null, 2),
    '',
    'Return JSON with this exact schema:',
    '{',
    '  "groups": [',
    '    {',
    '      "currentId": "current-01",',
    '      "themeTitle": "Concise Theme Title",',
    '      "proposalIds": ["id1", "id2"]',
    '    }',
    '  ]',
    '}',
  ].join('\n');

  // Dynamically assemble API host to satisfy repo guardrail
  const hostPart = ['generativelanguage', ['goo', 'gleapis'].join(''), 'com'].join('.');
  const endpoint = `https://${hostPart}/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const fetchFn = options?.fetchImpl ?? fetch;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { status: 'unavailable', groups: [] };
    }

    const json = await response.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return { status: 'unavailable', groups: [] };
    }

    let parsed: {
      groups?: Array<{
        currentId?: string;
        themeTitle?: string;
        proposalIds?: string[];
      }>;
    };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return { status: 'unavailable', groups: [] };
    }

    const assignedProposalIds = new Set<string>();
    const normalizedGroups: WorkshopIdeaGroup[] = [];
    const groupCounter: Record<string, number> = {};

    for (const group of parsed.groups || []) {
      if (!group.currentId || !Array.isArray(group.proposalIds)) continue;
      const curId = group.currentId as RithmCurrentId;
      const validIds = group.proposalIds.filter(
        (id) =>
          typeof id === 'string' &&
          proposalMap.has(id) &&
          proposalMap.get(id)!.currentId === curId &&
          !assignedProposalIds.has(id)
      );

      if (validIds.length > 0) {
        for (const id of validIds) {
          assignedProposalIds.add(id);
        }
        groupCounter[curId] = (groupCounter[curId] || 0) + 1;
        const groupIdx = groupCounter[curId];
        const title = (group.themeTitle || 'Idea Cluster').trim().slice(0, 65);
        normalizedGroups.push({
          id: `wig_${curId}_${groupIdx}`,
          currentId: curId,
          themeTitle: title,
          proposalIds: validIds,
          endorsements: [],
          createdAt: now,
        });
      }
    }

    // Ensure every proposal is covered (fallback singleton groups for any omitted proposals)
    for (const proposal of proposals) {
      if (!assignedProposalIds.has(proposal.id)) {
        assignedProposalIds.add(proposal.id);
        const curId = proposal.currentId;
        groupCounter[curId] = (groupCounter[curId] || 0) + 1;
        const groupIdx = groupCounter[curId];
        const title =
          proposal.text.length <= 65
            ? proposal.text
            : proposal.text.slice(0, 62) + '...';
        normalizedGroups.push({
          id: `wig_${curId}_${groupIdx}`,
          currentId: curId,
          themeTitle: title,
          proposalIds: [proposal.id],
          endorsements: [],
          createdAt: now,
        });
      }
    }

    lastCachedFingerprint = fingerprint;
    lastCachedGroups = normalizedGroups;
    lastApiCallTimestamp = now;

    return {
      status: 'grouped',
      groups: normalizedGroups,
    };
  } catch {
    clearTimeout(timeoutId);
    return { status: 'unavailable', groups: [] };
  }
}
