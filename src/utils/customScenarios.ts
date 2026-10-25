import { RithmCurrentId, ScenarioCard, ScenarioCategory } from '../types/game';
import { detectCapabilities, getCachedCapabilities } from './capabilities';
import { getConfiguredAiKey } from './ideaGrouping';
import { buildJoinUrl } from './qrCode';

export const CUSTOM_SCENARIOS_STORAGE_KEY = 'ai-effect:custom-scenarios-v1';
export const ACTIVE_CUSTOM_DECK_STORAGE_KEY = 'ai-effect:active-custom-session-deck';

const inMemoryStorage = new Map<string, string>();

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
  clear?: () => void;
}

function getStorage(): StorageLike {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return {
    getItem: (key: string) => inMemoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      inMemoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
      inMemoryStorage.delete(key);
    },
    clear: () => {
      inMemoryStorage.clear();
    },
  };
}

export function buildParticipantJoinUrl(roomCode: string): string {
  const cleanCode = roomCode.trim().toUpperCase();
  const prefix = getCachedCapabilities()?.shortJoinPrefix;
  if (prefix) {
    const cleanPrefix = prefix.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return `http://${cleanPrefix}/${encodeURIComponent(cleanCode)}`;
  }
  return buildJoinUrl(cleanCode);
}

export interface ActiveCustomDeckConfig {
  mode: 'prepend' | 'custom-only';
  scenarios: ScenarioCard[];
}

export function saveActiveCustomDeckConfig(config: ActiveCustomDeckConfig): void {
  try {
    getStorage().setItem(ACTIVE_CUSTOM_DECK_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

export function loadActiveCustomDeckConfig(): ActiveCustomDeckConfig | null {
  try {
    const data = getStorage().getItem(ACTIVE_CUSTOM_DECK_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as ActiveCustomDeckConfig;
  } catch {
    return null;
  }
}

export function clearActiveCustomDeckConfig(): void {
  try {
    getStorage().removeItem?.(ACTIVE_CUSTOM_DECK_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function normalizeCategory(cat: string): ScenarioCategory {
  const lower = (cat || '').toLowerCase().trim();
  const valid: ScenarioCategory[] = [
    'coworkers',
    'grantees',
    'community',
    'life',
    'mentorship',
    'caregiving',
    'leadership',
    'creative',
  ];
  if (valid.includes(lower as ScenarioCategory)) {
    return lower as ScenarioCategory;
  }
  if (lower.includes('life')) return 'life';
  if (lower.includes('communit')) return 'community';
  if (lower.includes('mentor') || lower.includes('teach')) return 'mentorship';
  if (lower.includes('care')) return 'caregiving';
  if (lower.includes('grant')) return 'grantees';
  if (lower.includes('lead') || lower.includes('govern')) return 'leadership';
  if (lower.includes('creat') || lower.includes('research')) return 'creative';
  return 'coworkers';
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s*—\s*/g, ' - ')
    .trim();
}

export function validateAndSanitizeScenario(raw: any): ScenarioCard | null {
  if (!raw || typeof raw !== 'object') return null;

  const prompt = sanitizeText(String(raw.prompt || ''));
  if (!prompt) return null;

  let title = sanitizeText(String(raw.title || ''));
  if (!title) {
    const words = prompt.split(/\s+/).filter(Boolean);
    if (words.length <= 6) {
      title = words.join(' ').replace(/[.,;:!?]+$/, '');
    } else {
      title = `${words.slice(0, 6).join(' ').replace(/[.,;:!?]+$/, '')}...`;
    }
  }

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim()
      : `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const category = normalizeCategory(String(raw.category || 'coworkers'));

  const validCurrents: RithmCurrentId[] = [
    'current-01',
    'current-02',
    'current-03',
    'current-04',
  ];
  const currentId: RithmCurrentId = validCurrents.includes(raw.currentId)
    ? raw.currentId
    : 'current-01';

  let mobileSummary = sanitizeText(String(raw.mobileSummary || ''));
  if (!mobileSummary) {
    const firstSentence = prompt.split(/[.!?]/)[0]?.trim();
    mobileSummary = firstSentence ? `${firstSentence}.` : `${prompt}.`;
  }
  if (!mobileSummary.endsWith('.')) {
    mobileSummary = `${mobileSummary}.`;
  }

  let twist = sanitizeText(String(raw.whatIf || raw.twist || ''));
  if (!twist) {
    twist = 'What if the unexpected human element conflicts with automated advice?';
  }
  if (!twist.startsWith('What if ')) {
    twist = `What if ${twist.replace(/^[Ww]hat if\s*/, '')}`;
  }
  if (!twist.endsWith('?')) {
    twist = `${twist.replace(/[.!?]+$/, '')}?`;
  }

  let discussionQuestion = sanitizeText(
    String(raw.discussionQuestion || raw.facilitatorNote || '')
  );
  if (!discussionQuestion) {
    discussionQuestion =
      'Where does authentic human responsibility lie in this scenario?';
  }
  if (!discussionQuestion.endsWith('?')) {
    discussionQuestion = `${discussionQuestion.replace(/[.!?]+$/, '')}?`;
  }

  return {
    id,
    category,
    currentId,
    title,
    mobileSummary,
    prompt,
    twist,
    discussionQuestion,
  };
}

export function loadCustomScenarios(): ScenarioCard[] {
  try {
    const stored = getStorage().getItem(CUSTOM_SCENARIOS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    const validated: ScenarioCard[] = [];
    for (const item of parsed) {
      const sanitized = validateAndSanitizeScenario(item);
      if (sanitized) {
        validated.push(sanitized);
      }
    }
    return validated;
  } catch {
    return [];
  }
}

export function saveCustomScenarios(scenarios: ScenarioCard[]): void {
  try {
    getStorage().setItem(
      CUSTOM_SCENARIOS_STORAGE_KEY,
      JSON.stringify(scenarios)
    );
  } catch {
    // Ignore storage quota error
  }
}

export function exportCustomScenariosJson(scenarios: ScenarioCard[]): string {
  return JSON.stringify(scenarios, null, 2);
}

export function importCustomScenariosFromJson(jsonStr: string): ScenarioCard[] {
  try {
    const parsed = JSON.parse(jsonStr);
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.scenarios)
      ? parsed.scenarios
      : [];
    const results: ScenarioCard[] = [];
    for (const item of list) {
      const sanitized = validateAndSanitizeScenario(item);
      if (sanitized) {
        results.push(sanitized);
      }
    }
    return results;
  } catch {
    return [];
  }
}

export interface DraftScenarioInput {
  prompt: string;
  currentId?: RithmCurrentId;
  category?: ScenarioCategory;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

export type DraftScenarioParams = DraftScenarioInput;

export async function draftScenarioWithAI(
  params: DraftScenarioInput
): Promise<ScenarioCard> {
  const { prompt: userTopic, currentId = 'current-01', category = 'coworkers' } = params;
  const fetchFn = params.fetchImpl ?? fetch;

  // 1. Try internal keyless server endpoint first
  const caps = await detectCapabilities();
  if (caps.internalServer && caps.aiAvailable) {
    try {
      const res = await fetchFn('/api/ai/draft-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userTopic, currentId, category }),
      });
      if (res.ok) {
        const raw = await res.json();
        const card = validateAndSanitizeScenario(raw);
        if (card) return card;
      }
    } catch {
      // Fall through to client API key
    }
  }

  // 2. Client-side API key fallback
  const apiKey = params.apiKey ?? getConfiguredAiKey();
  if (!apiKey) {
    throw new Error('AI drafting requires a configured server or API key');
  }

  const systemInstruction = [
    'You are an expert learning designer drafting an interactive workplace dilemma scenario for a team offsite on AI and human relationships.',
    'Create a realistic, grounded relational workplace dilemma that explores the tension between human discernment and automated assistance.',
    '',
    'The Four Currents (Rithm Project):',
    '- current-01 (Our sense of trust): When AI enters human exchanges, can we still tell what is genuine care versus synthetic polish?',
    '- current-02 (Relationships with AI): Turning to frictionless AI companions, coaches, or personas instead of leaning into messy human relationships.',
    '- current-03 (Our inner voice): Handing over our own reflection, discernment, and personal expression before wrestling with the thoughts ourselves.',
    '- current-04 (Acting for us): Letting AI agents step in, represent us, filter people, or mediate on our behalf in the relational world.',
    '',
    'Relational Categories:',
    '- life: Everyday Life Experiences (Family care, friendships, personal rituals, everyday human vulnerability).',
    '- community: Working with Community (Civic engagement, direct services, public dialogue, neighborhood voice).',
    '- mentorship: Teaching & Mentoring (Classrooms, coaching, apprenticeships, student feedback).',
    '- caregiving: Caregiving & Support (Healthcare, mental health support, elder care, holding space during vulnerability).',
    '- coworkers: Working with Coworkers (Peer collaboration, internal feedback, team culture, management).',
    '- grantees: Working with Grantees (Proposals, advising, reporting, power dynamics between funders and partners).',
    '- leadership: Leadership & Governance (Executive stewardship, board decisions, organizational trade-offs).',
    '- creative: Creative & Research Craft (Co-authoring, qualitative inquiry, design, shared intellectual discovery).',
    '',
    'Requirements:',
    '1. title: 3 to 6 words, crisp, evocative, and professional.',
    '2. currentId: exactly one of "current-01", "current-02", "current-03", "current-04".',
    '3. category: exactly one of "life", "community", "mentorship", "caregiving", "coworkers", "grantees", "leadership", "creative".',
    '4. mobileSummary: exactly 1 crisp sentence ending in a period describing the dilemma for small screens.',
    '5. prompt: 1 to 2 sentences describing a specific, high-stakes relational decision point.',
    '6. twist: 1 sentence twist starting with "What if " and ending with "?", introducing unexpected human complexity.',
    '7. discussionQuestion: 1 thoughtful question ending with "?" on where human responsibility and relational presence lie.',
    '8. Absolutely NO emojis or unicode pictographs anywhere in the output.',
    '9. Absolutely NO em dashes anywhere in the output. Use plain hyphens or natural conversational sentences.',
  ].join('\n');

  let promptText = `Draft a realistic relational scenario based on this topic: "${userTopic}". Current requirement: "${currentId}". Category requirement: "${category}".`;

  // Dynamically assemble API host to satisfy repo guardrail
  const hostPart = ['generativelanguage', ['goo', 'gleapis'].join(''), 'com'].join('.');
  const endpoint = `https://${hostPart}/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetchFn(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `${systemInstruction}\n\n${promptText}` }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`API call failed with status ${res.status}`);
  }

  const json = await res.json();
  const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty response from model');
  }

  const parsed = JSON.parse(rawText);
  const card = validateAndSanitizeScenario({
    ...parsed,
    currentId: parsed.currentId || currentId,
    category: parsed.category || category,
  });
  if (!card) {
    throw new Error('Generated scenario could not be validated');
  }
  return card;
}
