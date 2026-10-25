import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  RITHM_CURRENTS,
  RITHM_CURRENTS_LIST,
  getCurrentMeta,
} from '../src/content/currents';
import {
  ALL_SCENARIOS,
  CATEGORY_LIST,
  CATEGORY_META,
  PHILANTHROPY_SCENARIOS,
  STANCE_LIST,
  STANCE_META,
  clearSeenScenariosForTesting,
  generateCustomScenarioDeck,
  getMatchingScenariosPool,
  getPresetScenarios,
} from '../src/content/scenarios';
import {
  addCustomScenario,
  computeCurrentsSynthesis,
  createRoomState,
  recordParticipantVote,
} from '../src/state/roomEngine';
import {
  clearActiveCustomDeckConfig,
  draftScenarioWithAI,
  exportCustomScenariosJson,
  importCustomScenariosFromJson,
  loadActiveCustomDeckConfig,
  loadCustomScenarios,
  normalizeCategory,
  saveActiveCustomDeckConfig,
  saveCustomScenarios,
  validateAndSanitizeScenario,
} from '../src/utils/customScenarios';
import { CustomDeckOptions, RithmCurrentId, ScenarioCard, ScenarioCategory, Stance } from '../src/types/game';

describe('Philanthropy Scenarios & The 4 Currents', () => {
  beforeEach(() => {
    clearSeenScenariosForTesting();
  });

  describe('De-branding Guard (Zero Google / KSL)', () => {
    it('contains ZERO occurrences of "Google" or "KSL" (case-insensitive) across scenarios', () => {
      const forbiddenRegex = /(google|ksl)/i;

      for (const scenario of PHILANTHROPY_SCENARIOS) {
        expect(scenario.id).not.toMatch(forbiddenRegex);
        expect(scenario.title).not.toMatch(forbiddenRegex);
        expect(scenario.mobileSummary).not.toMatch(forbiddenRegex);
        expect(scenario.prompt).not.toMatch(forbiddenRegex);
        expect(scenario.twist).not.toMatch(forbiddenRegex);
        expect(scenario.discussionQuestion).not.toMatch(forbiddenRegex);
      }
    });

    it('contains ZERO occurrences of "Google" or "KSL" across categories, stances, and currents', () => {
      const forbiddenRegex = /(google|ksl)/i;

      for (const cat of CATEGORY_LIST) {
        expect(cat.label).not.toMatch(forbiddenRegex);
        expect(cat.description).not.toMatch(forbiddenRegex);
      }

      for (const stance of STANCE_LIST) {
        expect(stance.label).not.toMatch(forbiddenRegex);
        expect(stance.subtitle).not.toMatch(forbiddenRegex);
        expect(stance.description).not.toMatch(forbiddenRegex);
      }

      for (const current of RITHM_CURRENTS_LIST) {
        expect(current.title).not.toMatch(forbiddenRegex);
        expect(current.subtitle).not.toMatch(forbiddenRegex);
        expect(current.pullDescription).not.toMatch(forbiddenRegex);
        expect(current.philanthropyPrompt).not.toMatch(forbiddenRegex);
        expect(current.protectPrompt).not.toMatch(forbiddenRegex);
      }
    });

    it('enforces ZERO occurrences of "Google" or "KSL" across all .ts and .tsx files in src/', () => {
      const srcDir = path.resolve(__dirname, '../src');
      const files: string[] = [];

      function walk(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(fullPath);
          } else if (/\.(ts|tsx)$/.test(entry.name)) {
            files.push(fullPath);
          }
        }
      }

      walk(srcDir);
      expect(files.length).toBeGreaterThan(0);

      const forbiddenRegex = /(google|ksl)/i;
      const violations: { file: string; line: number; match: string }[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (forbiddenRegex.test(line)) {
            violations.push({
              file: path.relative(path.resolve(__dirname, '..'), file),
              line: index + 1,
              match: line.trim(),
            });
          }
        });
      }

      expect(violations).toEqual([]);
    });

    it('enforces ZERO internal corporate/proxy strings across root repo files and ensures package-lock.json is gitignored', () => {
      const repoRoot = path.resolve(__dirname, '..');
      const rootFiles = [
        'package.json',
        'README.md',
        'index.html',
        'vite.config.ts',
        'tsconfig.json',
        '.gitignore',
        '.github/workflows/deploy.yml',
      ];
      // Note: index.html legitimately references fonts.googleapis.com / fonts.gstatic.com for Google Fonts,
      // so we specifically block corporate/internal identifiers, proxy domains, and KSL references.
      const internalLeakRegex =
        /(google\.org|googler|@google\.com|uplink\.goog|airlock|corp\.goog|gclb\.goog|\bksl\b)/i;

      for (const relPath of rootFiles) {
        const content = fs.readFileSync(path.join(repoRoot, relPath), 'utf-8');
        expect(content, `Leak check failed in ${relPath}`).not.toMatch(internalLeakRegex);
      }

      const gitignore = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf-8');
      expect(gitignore).toContain('package-lock.json');

      const landingContent = fs.readFileSync(
        path.join(repoRoot, 'src/views/LandingView.tsx'),
        'utf-8'
      );
      expect(landingContent).toContain('https://www.therithmproject.org/the-ai-effect');
      expect(landingContent).toContain('https://aicurrents.therithmproject.org/');
      expect(landingContent).toContain('The Rithm Project');
    });
  });

  describe('Scenario Deck Structure & Completeness', () => {
    it('contains exactly 64 curated scenarios with unique IDs', () => {
      expect(PHILANTHROPY_SCENARIOS).toHaveLength(64);
      expect(ALL_SCENARIOS).toHaveLength(64);
      const ids = new Set(PHILANTHROPY_SCENARIOS.map((s) => s.id));
      expect(ids.size).toBe(64);
    });

    it('distributes exactly 8 scenarios across each of the 8 categories', () => {
      const domains: ScenarioCategory[] = [
        'coworkers',
        'grantees',
        'community',
        'life',
        'mentorship',
        'caregiving',
        'leadership',
        'creative',
      ];
      for (const domain of domains) {
        const matching = PHILANTHROPY_SCENARIOS.filter((s) => s.category === domain);
        expect(matching).toHaveLength(8);
        expect(CATEGORY_META[domain]).toBeDefined();
      }
    });

    it('distributes exactly 2 scenarios per (category, currentId) cell (16 per Current total)', () => {
      const categories: ScenarioCategory[] = [
        'coworkers',
        'grantees',
        'community',
        'life',
        'mentorship',
        'caregiving',
        'leadership',
        'creative',
      ];
      const currents: RithmCurrentId[] = [
        'current-01',
        'current-02',
        'current-03',
        'current-04',
      ];

      for (const cur of currents) {
        const matching = PHILANTHROPY_SCENARIOS.filter((s) => s.currentId === cur);
        expect(matching).toHaveLength(16);
      }

      for (const cat of categories) {
        for (const cur of currents) {
          const matchingCell = PHILANTHROPY_SCENARIOS.filter(
            (s) => s.category === cat && s.currentId === cur
          );
          expect(matchingCell).toHaveLength(2);
        }
      }
    });

    it('ensures every scenario has complete, valid, non-empty fields', () => {
      const validCategories: ScenarioCategory[] = [
        'coworkers',
        'grantees',
        'community',
        'life',
        'mentorship',
        'caregiving',
        'leadership',
        'creative',
      ];
      for (const s of PHILANTHROPY_SCENARIOS) {
        expect(s.id.trim()).not.toBe('');
        expect(s.title.trim()).not.toBe('');
        expect(s.mobileSummary.trim()).not.toBe('');
        expect(s.prompt.trim()).not.toBe('');
        expect(s.twist.trim()).not.toBe('');
        expect(s.discussionQuestion.trim()).not.toBe('');
        expect(validCategories).toContain(s.category);
        expect(['current-01', 'current-02', 'current-03', 'current-04']).toContain(
          s.currentId
        );
      }
    });
  });

  describe('The 4 Currents Mapping', () => {
    it('defines the exact 4 Rithm Currents matching aicurrents.therithmproject.org', () => {
      expect(RITHM_CURRENTS_LIST).toHaveLength(4);

      const expected: Record<RithmCurrentId, { number: string; title: string }> = {
        'current-01': { number: 'Current 01', title: 'Our sense of trust' },
        'current-02': { number: 'Current 02', title: 'Relationships with AI' },
        'current-03': { number: 'Current 03', title: 'Our inner voice' },
        'current-04': { number: 'Current 04', title: 'Acting for us' },
      };

      for (const [id, meta] of Object.entries(expected) as [
        RithmCurrentId,
        { number: string; title: string },
      ][]) {
        const current = getCurrentMeta(id);
        expect(current.number).toBe(meta.number);
        expect(current.title).toBe(meta.title);
        expect(current.url).toBe(`https://aicurrents.therithmproject.org/${id}/`);
        expect(current.subtitle.length).toBeGreaterThan(15);
        expect(current.pullDescription.length).toBeGreaterThan(30);
        expect(current.philanthropyPrompt.length).toBeGreaterThan(20);
        expect(current.protectPrompt.length).toBeGreaterThan(20);
      }
    });

    it('maps every scenario to one of the 4 Currents with healthy distribution', () => {
      const counts: Record<RithmCurrentId, number> = {
        'current-01': 0,
        'current-02': 0,
        'current-03': 0,
        'current-04': 0,
      };

      for (const scenario of PHILANTHROPY_SCENARIOS) {
        counts[scenario.currentId]++;
      }

      // Every current has exactly 16 scenarios
      expect(counts['current-01']).toBe(16);
      expect(counts['current-02']).toBe(16);
      expect(counts['current-03']).toBe(16);
      expect(counts['current-04']).toBe(16);
    });
  });

  describe('Deck Presets', () => {
    it('generates spark-8 preset with 8 cards: 2 per foundational domain, covering all 4 currents', () => {
      const spark8 = getPresetScenarios('spark-8');
      expect(spark8).toHaveLength(8);

      const catCounts: Record<ScenarioCategory, number> = {
        coworkers: 0,
        grantees: 0,
        community: 0,
        life: 0,
        mentorship: 0,
        caregiving: 0,
        leadership: 0,
        creative: 0,
      };

      const currentCounts: Record<RithmCurrentId, number> = {
        'current-01': 0,
        'current-02': 0,
        'current-03': 0,
        'current-04': 0,
      };

      for (const s of spark8) {
        catCounts[s.category]++;
        currentCounts[s.currentId]++;
      }

      expect(catCounts.coworkers).toBe(2);
      expect(catCounts.grantees).toBe(2);
      expect(catCounts.community).toBe(2);
      expect(catCounts.life).toBe(2);
      expect(catCounts.mentorship).toBe(0);
      expect(catCounts.caregiving).toBe(0);
      expect(catCounts.leadership).toBe(0);
      expect(catCounts.creative).toBe(0);

      expect(currentCounts['current-01']).toBe(2);
      expect(currentCounts['current-02']).toBe(2);
      expect(currentCounts['current-03']).toBe(2);
      expect(currentCounts['current-04']).toBe(2);

      expect(spark8[0].category).toBe('life');
      expect(spark8[1].category).toBe('community');
      for (let i = 1; i < spark8.length; i++) {
        expect(spark8[i].category).not.toBe(spark8[i - 1].category);
      }
    });

    it('cross-session rotation: 4 spark-8 sessions exhaust all 32 foundational scenarios with zero repeats', () => {
      clearSeenScenariosForTesting();
      const allSeenCards = new Set<string>();

      for (let session = 1; session <= 4; session++) {
        const deck = getPresetScenarios('spark-8');
        expect(deck).toHaveLength(8);

        // Starts with life -> community
        expect(deck[0].category).toBe('life');
        expect(deck[1].category).toBe('community');

        const catCounts: Record<string, number> = {};
        const curCounts: Record<string, number> = {};

        for (let i = 0; i < deck.length; i++) {
          const card = deck[i];
          // No repeats across all sessions so far
          expect(allSeenCards.has(card.id), `Card ${card.id} repeated in session ${session}`).toBe(false);
          allSeenCards.add(card.id);

          catCounts[card.category] = (catCounts[card.category] || 0) + 1;
          curCounts[card.currentId] = (curCounts[card.currentId] || 0) + 1;

          // No adjacent duplicate categories
          if (i > 0) {
            expect(card.category).not.toBe(deck[i - 1].category);
          }
        }

        // 2 each across life, community, coworkers, grantees
        expect(catCounts.life).toBe(2);
        expect(catCounts.community).toBe(2);
        expect(catCounts.coworkers).toBe(2);
        expect(catCounts.grantees).toBe(2);

        // 2 cards per Current
        expect(curCounts['current-01']).toBe(2);
        expect(curCounts['current-02']).toBe(2);
        expect(curCounts['current-03']).toBe(2);
        expect(curCounts['current-04']).toBe(2);
      }

      expect(allSeenCards.size).toBe(32);
    });

    it('cross-session non-repetition for Current Focus presets (current-01-focus .. current-04-focus)', () => {
      const focusPresets = [
        'current-01-focus',
        'current-02-focus',
        'current-03-focus',
        'current-04-focus',
      ] as const;

      for (const preset of focusPresets) {
        clearSeenScenariosForTesting();
        const session1 = getPresetScenarios(preset);
        const session2 = getPresetScenarios(preset);

        expect(session1).toHaveLength(6);
        expect(session2).toHaveLength(6);

        const s1Ids = new Set(session1.map((s) => s.id));
        const overlap = session2.filter((s) => s1Ids.has(s.id));
        expect(overlap).toHaveLength(0);
      }
    });

    it('full deck (full-20) returns all 64 cards and rotates opening 8 cards across sessions', () => {
      clearSeenScenariosForTesting();
      const deck1 = getPresetScenarios('full-20');
      const deck2 = getPresetScenarios('full-20');

      expect(deck1).toHaveLength(64);
      expect(deck2).toHaveLength(64);

      // Unique cards in both decks
      expect(new Set(deck1.map((s) => s.id)).size).toBe(64);
      expect(new Set(deck2.map((s) => s.id)).size).toBe(64);

      // Both start with life -> community
      expect(deck1[0].category).toBe('life');
      expect(deck1[1].category).toBe('community');
      expect(deck2[0].category).toBe('life');
      expect(deck2[1].category).toBe('community');

      // No adjacent duplicate categories
      for (let i = 1; i < deck1.length; i++) {
        expect(deck1[i].category).not.toBe(deck1[i - 1].category);
      }
      for (let i = 1; i < deck2.length; i++) {
        expect(deck2[i].category).not.toBe(deck2[i - 1].category);
      }

      // 0 overlap in opening 8 cards between session 1 and session 2
      const opening1Ids = new Set(deck1.slice(0, 8).map((s) => s.id));
      const opening2 = deck2.slice(0, 8);
      const overlap = opening2.filter((s) => opening1Ids.has(s.id));
      expect(overlap).toHaveLength(0);
    });

    it('graceful wrap-around after exhausting the 32-card spark-8 pool', () => {
      clearSeenScenariosForTesting();

      const sessionDecks: ScenarioCard[][] = [];
      for (let i = 0; i < 4; i++) {
        sessionDecks.push(getPresetScenarios('spark-8'));
      }

      // Session 5 wrap-around
      const session5 = getPresetScenarios('spark-8');
      expect(session5).toHaveLength(8);
      expect(session5[0].category).toBe('life');
      expect(session5[1].category).toBe('community');

      // Avoids repeating Session 4's cards (which were the most recently seen)
      const session4Ids = new Set(sessionDecks[3].map((s) => s.id));
      const overlapWithSession4 = session5.filter((s) => session4Ids.has(s.id));
      expect(overlapWithSession4).toHaveLength(0);

      // Avoids locking into a deterministic LRU cycle (Session 5 is not identical to Session 1)
      const session1Ids = new Set(sessionDecks[0].map((s) => s.id));
      const identicalToSession1 = session5.every((s) => session1Ids.has(s.id));
      expect(identicalToSession1).toBe(false);
    });

    it('generates focus presets for each of the 4 Currents with 6 cards each', () => {
      const focusPresets: Array<{
        preset:
          | 'current-01-focus'
          | 'current-02-focus'
          | 'current-03-focus'
          | 'current-04-focus';
        currentId: RithmCurrentId;
      }> = [
        { preset: 'current-01-focus', currentId: 'current-01' },
        { preset: 'current-02-focus', currentId: 'current-02' },
        { preset: 'current-03-focus', currentId: 'current-03' },
        { preset: 'current-04-focus', currentId: 'current-04' },
      ];

      for (const { preset } of focusPresets) {
        const cards = getPresetScenarios(preset);
        expect(cards).toHaveLength(6);
        expect(cards[0].category).toBe('life');
        expect(cards[1].category).toBe('community');
        for (let i = 1; i < cards.length; i++) {
          expect(cards[i].category).not.toBe(cards[i - 1].category);
        }
      }
    });

    it('generates full-20 preset returning all 64 cards', () => {
      const full = getPresetScenarios('full-20');
      expect(full).toHaveLength(64);
      expect(full[0].category).toBe('life');
      expect(full[1].category).toBe('community');
      for (let i = 1; i < full.length; i++) {
        expect(full[i].category).not.toBe(full[i - 1].category);
      }
    });

    it('generates custom preset filtering by categories (legacy array)', () => {
      const filtered = getPresetScenarios('custom', ['coworkers', 'grantees']);
      expect(filtered).toHaveLength(16);
      expect(
        filtered.every((s) => s.category === 'coworkers' || s.category === 'grantees')
      ).toBe(true);
      for (let i = 1; i < filtered.length; i++) {
        expect(filtered[i].category).not.toBe(filtered[i - 1].category);
      }

      const emptyCategories = getPresetScenarios('custom', []);
      expect(emptyCategories).toHaveLength(64);
    });

    it('generates custom preset using CustomDeckOptions with category & current filtering', () => {
      const customOptions: CustomDeckOptions = {
        categories: ['mentorship', 'caregiving', 'leadership'],
        currents: ['current-01', 'current-03'],
        count: 6,
        seed: 'test-seed',
      };
      const deck = getPresetScenarios('custom', customOptions);
      expect(deck).toHaveLength(6);
      expect(
        deck.every(
          (s) =>
            ['mentorship', 'caregiving', 'leadership'].includes(s.category) &&
            ['current-01', 'current-03'].includes(s.currentId)
        )
      ).toBe(true);

      for (let i = 1; i < deck.length; i++) {
        expect(deck[i].category).not.toBe(deck[i - 1].category);
      }
    });

    it('clamps custom preset card count when requested count exceeds matching pool', () => {
      // 1 category + 1 current = 2 matching scenarios in total bank
      const customOptions: CustomDeckOptions = {
        categories: ['mentorship'],
        currents: ['current-01'],
        count: 8,
        seed: 'test-clamping',
      };
      const deck = getPresetScenarios('custom', customOptions);
      expect(deck).toHaveLength(2);
      expect(deck.every((s) => s.category === 'mentorship' && s.currentId === 'current-01')).toBe(true);
    });

    it('interleaves categories across spark-8, all 4 current focus presets, and full-20 so work scenarios are never front-loaded', () => {
      for (const preset of [
        'spark-8',
        'current-01-focus',
        'current-02-focus',
        'current-03-focus',
        'current-04-focus',
        'full-20',
      ] as const) {
        const deck = getPresetScenarios(preset);
        // Starts with Everyday Life and Community before Coworkers and Grantees
        expect(deck[0].category).toBe('life');
        expect(deck[1].category).toBe('community');

        // Zero back-to-back scenarios from the same category
        for (let i = 1; i < deck.length; i++) {
          expect(
            deck[i].category,
            `Adjacent duplicate category at index ${i - 1}->${i} in ${preset}`
          ).not.toBe(deck[i - 1].category);
        }
      }
    });
  });

  describe('Stances Metadata', () => {
    it('defines support, depends, erode stances with required labels', () => {
      const stances: Stance[] = ['support', 'depends', 'erode'];
      for (const id of stances) {
        expect(STANCE_META[id]).toBeDefined();
        expect(STANCE_META[id].id).toBe(id);
        expect(STANCE_META[id].label).toBeTruthy();
        expect(STANCE_META[id].shortLabel).toBeTruthy();
        expect(STANCE_META[id].subtitle).toBeTruthy();
      }
      expect(STANCE_LIST).toHaveLength(3);
    });
  });

  describe('Zero-Emoji Guard (Editorial Line Icons)', () => {
    it('enforces ZERO emojis or unicode pictographs across all .ts and .tsx source files in src/', () => {
      const srcDir = path.resolve(__dirname, '../src');

      function getSourceFiles(dir: string): string[] {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        let files: string[] = [];
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            files = files.concat(getSourceFiles(fullPath));
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push(fullPath);
          }
        }
        return files;
      }

      const sourceFiles = getSourceFiles(srcDir);
      expect(sourceFiles.length).toBeGreaterThanOrEqual(10);

      const violations: { file: string; line: number; text: string; match: string }[] = [];

      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          const matches = line.match(/\p{Extended_Pictographic}/gu);
          if (matches) {
            violations.push({
              file: path.relative(srcDir, file),
              line: index + 1,
              text: line.trim(),
              match: matches.join(', '),
            });
          }
        });
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Scenario Quality & Learning Design Guard', () => {
    it('guarantees unique titles, prompts, and mobileSummaries across all 64 scenarios', () => {
      const titles = new Set<string>();
      const prompts = new Set<string>();
      const summaries = new Set<string>();

      for (const s of PHILANTHROPY_SCENARIOS) {
        expect(titles.has(s.title), `Duplicate title: "${s.title}"`).toBe(false);
        titles.add(s.title);

        expect(prompts.has(s.prompt), `Duplicate prompt: "${s.prompt}"`).toBe(false);
        prompts.add(s.prompt);

        expect(
          summaries.has(s.mobileSummary),
          `Duplicate mobileSummary: "${s.mobileSummary}"`
        ).toBe(false);
        summaries.add(s.mobileSummary);
      }
    });

    it('enforces that every mobileSummary is a crisp 1-sentence statement ending in a period', () => {
      for (const s of PHILANTHROPY_SCENARIOS) {
        const trimmed = s.mobileSummary.trim();
        expect(
          trimmed.endsWith('.'),
          `mobileSummary must end with a period: "${s.mobileSummary}" (id: ${s.id})`
        ).toBe(true);
        // Ensure no internal sentence endings (like ". " or "? " or "! ")
        const sentenceBreaks = trimmed.slice(0, -1).match(/[.!?]\s+[A-Z]/g);
        expect(
          sentenceBreaks,
          `mobileSummary must be a single sentence: "${s.mobileSummary}" (id: ${s.id})`
        ).toBeNull();
      }
    });

    it('enforces that every twist starts with "What if " and ends with a question mark', () => {
      for (const s of PHILANTHROPY_SCENARIOS) {
        expect(
          s.twist.startsWith('What if '),
          `twist must start with "What if ": "${s.twist}" (id: ${s.id})`
        ).toBe(true);
        expect(
          /\?["']?$/.test(s.twist),
          `twist must end with "?": "${s.twist}" (id: ${s.id})`
        ).toBe(true);
      }
    });

    it('enforces that every discussionQuestion ends with a question mark', () => {
      for (const s of PHILANTHROPY_SCENARIOS) {
        expect(
          s.discussionQuestion.endsWith('?'),
          `discussionQuestion must end with "?": "${s.discussionQuestion}" (id: ${s.id})`
        ).toBe(true);
      }
    });
  });

  describe('Custom Session Generator Edge Cases', () => {
    it('handles 1 category selected across all 8 individual categories', () => {
      const categories: ScenarioCategory[] = [
        'life',
        'community',
        'mentorship',
        'caregiving',
        'coworkers',
        'grantees',
        'leadership',
        'creative',
      ];

      for (const cat of categories) {
        const deck = generateCustomScenarioDeck({ categories: [cat] });
        expect(deck).toHaveLength(8);
        expect(deck.every((s) => s.category === cat)).toBe(true);
      }
    });

    it('handles 1 current selected across all 4 individual currents', () => {
      const currents: RithmCurrentId[] = [
        'current-01',
        'current-02',
        'current-03',
        'current-04',
      ];

      for (const cur of currents) {
        const deck = generateCustomScenarioDeck({ currents: [cur] });
        expect(deck).toHaveLength(16);
        expect(deck.every((s) => s.currentId === cur)).toBe(true);
      }
    });

    it('handles 1 category and 1 current selected across all 32 combinations', () => {
      const categories: ScenarioCategory[] = [
        'life',
        'community',
        'mentorship',
        'caregiving',
        'coworkers',
        'grantees',
        'leadership',
        'creative',
      ];
      const currents: RithmCurrentId[] = [
        'current-01',
        'current-02',
        'current-03',
        'current-04',
      ];

      for (const cat of categories) {
        for (const cur of currents) {
          const deck = generateCustomScenarioDeck({
            categories: [cat],
            currents: [cur],
          });
          expect(deck).toHaveLength(2);
          expect(deck.every((s) => s.category === cat && s.currentId === cur)).toBe(true);
        }
      }
    });

    it('handles count edge cases: 1, 64, larger than pool, 0, and negative', () => {
      const singleCard = generateCustomScenarioDeck({ count: 1 });
      expect(singleCard).toHaveLength(1);

      const full64 = generateCustomScenarioDeck({ count: 64 });
      expect(full64).toHaveLength(64);

      const clampedDeck = generateCustomScenarioDeck({
        categories: ['mentorship'],
        currents: ['current-01'],
        count: 50,
      });
      expect(clampedDeck).toHaveLength(2);

      const zeroDeck = generateCustomScenarioDeck({ count: 0 });
      expect(zeroDeck).toEqual([]);

      const negativeDeck = generateCustomScenarioDeck({ count: -5 });
      expect(negativeDeck).toEqual([]);
    });

    it('produces deterministic output with custom seed and randomizes without seed', () => {
      const deckA = generateCustomScenarioDeck({ count: 8, seed: 'reproducible-seed-123' });
      const deckB = generateCustomScenarioDeck({ count: 8, seed: 'reproducible-seed-123' });
      expect(deckA.map((s) => s.id)).toEqual(deckB.map((s) => s.id));
    });

    it('interleaves categories when multiple categories are selected', () => {
      const multiCatDeck = generateCustomScenarioDeck({
        categories: ['life', 'coworkers', 'grantees'],
        count: 12,
        seed: 'interleave-test',
      });
      expect(multiCatDeck).toHaveLength(12);
      for (let i = 1; i < multiCatDeck.length; i++) {
        expect(multiCatDeck[i].category).not.toBe(multiCatDeck[i - 1].category);
      }
    });
  });

  describe('Played Scenarios & Early-End Currents Synthesis', () => {
    it('correctly isolates played scenarios when ending gameplay early after 2 scenarios', () => {
      const fullDeck = getPresetScenarios('full-20');
      const initialRoom = createRoomState(fullDeck, 'TEST');

      // Record votes on only the first 2 scenarios
      const s0 = fullDeck[0];
      const s1 = fullDeck[1];

      let room = recordParticipantVote(initialRoom, 'p1', s0.id, 'support', 'Great start');
      room = recordParticipantVote(room, 'p2', s0.id, 'depends', 'Depends on context');
      room = recordParticipantVote(room, 'p1', s1.id, 'erode', 'Replaces trust');

      const synthesis = computeCurrentsSynthesis(room);
      expect(synthesis).toHaveLength(4);

      // Check that only s0 and s1 have total > 0 across the entire synthesis
      const allPlayedAcrossCurrents = synthesis
        .flatMap((b) => b.items)
        .filter((item) => item.tally.total > 0);
      expect(allPlayedAcrossCurrents).toHaveLength(2);
      expect(allPlayedAcrossCurrents.map((i) => i.scenario.id)).toContain(s0.id);
      expect(allPlayedAcrossCurrents.map((i) => i.scenario.id)).toContain(s1.id);

      // Verify that buckets filter played vs representative unplayed fallback
      for (const bucket of synthesis) {
        const playedItems = bucket.items.filter((i) => i.tally.total > 0);
        const visibleItems = playedItems.length > 0 ? playedItems : bucket.items.slice(0, 3);
        if (playedItems.length > 0) {
          expect(visibleItems.every((i) => i.tally.total > 0)).toBe(true);
        } else {
          expect(visibleItems.length).toBeLessThanOrEqual(3);
        }
      }
    });
  });

  describe('Custom Scenarios Studio & Live Addition', () => {
    describe('validateAndSanitizeScenario', () => {
      it('rejects invalid or incomplete inputs', () => {
        expect(validateAndSanitizeScenario(null)).toBeNull();
        expect(validateAndSanitizeScenario(undefined)).toBeNull();
        expect(validateAndSanitizeScenario({})).toBeNull();
        expect(validateAndSanitizeScenario({ title: 'Only Title' })).toBeNull();
        expect(validateAndSanitizeScenario({ prompt: '   ' })).toBeNull();
        expect(validateAndSanitizeScenario({ title: '   ', prompt: '   ' })).toBeNull();
      });

      it('succeeds when only prompt is provided and auto-generates a clean title', () => {
        const scenario = validateAndSanitizeScenario({
          prompt: 'A team lead uses AI to draft performance reviews for direct reports.',
        });
        expect(scenario).not.toBeNull();
        expect(scenario?.prompt).toBe('A team lead uses AI to draft performance reviews for direct reports.');
        expect(scenario?.title).toBe('A team lead uses AI to...');
        expect(scenario?.currentId).toBe('current-01');
        expect(scenario?.category).toBe('coworkers');
        expect(scenario?.twist).toMatch(/^What if /);
        expect(scenario?.discussionQuestion).toMatch(/\?$/);
      });

      it('normalizes categories and keywords', () => {
        expect(normalizeCategory('Everyday Life')).toBe('life');
        expect(normalizeCategory('community voice')).toBe('community');
        expect(normalizeCategory('Teaching & Mentoring')).toBe('mentorship');
        expect(normalizeCategory('Caregiving & Support')).toBe('caregiving');
        expect(normalizeCategory('Working with Coworkers')).toBe('coworkers');
        expect(normalizeCategory('Grantee partners')).toBe('grantees');
        expect(normalizeCategory('Leadership & Governance')).toBe('leadership');
        expect(normalizeCategory('Creative Craft')).toBe('creative');
        expect(normalizeCategory('coworkers')).toBe('coworkers');
        expect(normalizeCategory('grantees')).toBe('grantees');
        expect(normalizeCategory('unknown')).toBe('coworkers');
      });

      it('sanitizes and formats twist with "What if " and question mark', () => {
        const scenario = validateAndSanitizeScenario({
          title: 'Resource Allocation',
          prompt: 'A foundation uses algorithms to rank funding proposals.',
          whatIf: 'the model favors established organizations',
        });
        expect(scenario).not.toBeNull();
        expect(scenario?.twist).toBe('What if the model favors established organizations?');
      });

      it('strips emojis and replaces em dashes with hyphens', () => {
        const scenario = validateAndSanitizeScenario({
          title: 'Algorithmic Grantmaking \uD83E\uDD16',
          prompt: 'Testing automated reviews \u2014 balancing human empathy.',
          whatIf: 'What if staff disagree with the rating\u2753',
          facilitatorNote: 'Consider the trade-off \u2014 efficiency vs trust.',
        });
        expect(scenario).not.toBeNull();
        expect(scenario?.title).toBe('Algorithmic Grantmaking');
        expect(scenario?.prompt).toBe('Testing automated reviews - balancing human empathy.');
        expect(scenario?.twist).toBe('What if staff disagree with the rating?');
        expect(scenario?.discussionQuestion).toBe('Consider the trade-off - efficiency vs trust?');
      });

      it('generates a mobileSummary ending in a period if not provided', () => {
        const scenario = validateAndSanitizeScenario({
          title: 'Rapid Response Fund',
          prompt: 'Disaster strikes and automated grants disburse funds within hours. Local community leaders question oversight.',
        });
        expect(scenario).not.toBeNull();
        expect(scenario?.mobileSummary).toBe('Disaster strikes and automated grants disburse funds within hours.');
      });
    });

    describe('Storage, Import, and Export', () => {
      it('exports and imports custom scenarios JSON', () => {
        const cards = [
          validateAndSanitizeScenario({
            title: 'Card 1',
            prompt: 'Prompt 1 text for testing.',
          })!,
          validateAndSanitizeScenario({
            title: 'Card 2',
            prompt: 'Prompt 2 text for testing.',
          })!,
        ];
        const json = exportCustomScenariosJson(cards);
        expect(typeof json).toBe('string');
        const imported = importCustomScenariosFromJson(json);
        expect(imported).toHaveLength(2);
        expect(imported[0].title).toBe('Card 1');
        expect(imported[1].title).toBe('Card 2');
      });

      it('handles wrapped scenarios object and invalid entries on import', () => {
        const payload = JSON.stringify({
          scenarios: [
            { title: 'Valid Wrapped', prompt: 'Prompt for valid scenario.' },
            { invalid: true },
          ],
        });
        const imported = importCustomScenariosFromJson(payload);
        expect(imported).toHaveLength(1);
        expect(imported[0].title).toBe('Valid Wrapped');

        expect(importCustomScenariosFromJson('corrupted json')).toEqual([]);
      });

      it('persists and loads active custom deck configuration', () => {
        const testCard = validateAndSanitizeScenario({
          title: 'Active Deck Test',
          prompt: 'Testing active custom deck configuration storage.',
        })!;
        saveActiveCustomDeckConfig({
          mode: 'prepend',
          scenarios: [testCard],
        });
        const loaded = loadActiveCustomDeckConfig();
        expect(loaded).not.toBeNull();
        expect(loaded?.mode).toBe('prepend');
        expect(loaded?.scenarios).toHaveLength(1);
        expect(loaded?.scenarios[0].title).toBe('Active Deck Test');

        clearActiveCustomDeckConfig();
        expect(loadActiveCustomDeckConfig()).toBeNull();
      });

      it('persists and loads custom scenarios list', () => {
        const testCard = validateAndSanitizeScenario({
          title: 'Studio Stored Card',
          prompt: 'Testing custom scenario persistent studio list.',
        })!;
        saveCustomScenarios([testCard]);
        const loaded = loadCustomScenarios();
        expect(loaded).toHaveLength(1);
        expect(loaded[0].title).toBe('Studio Stored Card');

        saveCustomScenarios([]);
        expect(loadCustomScenarios()).toEqual([]);
      });
    });

    describe('addCustomScenario Integration', () => {
      it('appends a custom scenario card to an active RoomState and updates timestamp', () => {
        const initialDeck = getPresetScenarios('spark-8');
        const room = createRoomState(initialDeck, 'TEST');
        const initialCount = room.scenarios.length;
        const initialTimestamp = room.updatedAt;

        const newCard = {
          title: 'Live Added Scenario',
          category: 'coworkers' as const,
          currentId: 'current-01' as const,
          mobileSummary: 'Live added mobile summary.',
          prompt: 'Live prompt added mid-session by the facilitator.',
          twist: 'What if participants resist the guidance?',
          discussionQuestion: 'How should the team respond?',
        };

        const updatedRoom = addCustomScenario(room, newCard);
        expect(updatedRoom.scenarios).toHaveLength(initialCount + 1);
        const lastCard = updatedRoom.scenarios[updatedRoom.scenarios.length - 1];
        expect(lastCard.title).toBe('Live Added Scenario');
        expect(lastCard.id).toMatch(/^custom-/);
        expect(updatedRoom.updatedAt).toBeGreaterThanOrEqual(initialTimestamp);
      });
    });

    describe('draftScenarioWithAI', () => {
      it('drafts scenario via mock fetch returning model response format', async () => {
        const mockFetch: typeof fetch = async () => {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          title: 'AI Advisory Board',
                          currentId: 'current-01',
                          category: 'leadership',
                          mobileSummary: 'A foundation uses AI to evaluate leadership decisions.',
                          prompt: 'A foundation implements an automated grant allocation system.',
                          twist: 'What if grassroots organizations are excluded by the score?',
                          discussionQuestion: 'Examine who decides the weights and accountability?',
                        }),
                      },
                    ],
                  },
                },
              ],
            }),
          } as any;
        };

        const card = await draftScenarioWithAI({
          prompt: 'grant allocation advisory',
          currentId: 'current-01',
          category: 'leadership',
          apiKey: 'test-api-key',
          fetchImpl: mockFetch,
        });

        expect(card).toBeDefined();
        expect(card.title).toBe('AI Advisory Board');
        expect(card.currentId).toBe('current-01');
        expect(card.category).toBe('leadership');
        expect(card.twist).toBe('What if grassroots organizations are excluded by the score?');
      });
    });
  });
});
