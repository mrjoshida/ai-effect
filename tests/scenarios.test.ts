import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  RITHM_CURRENTS,
  RITHM_CURRENTS_LIST,
  getCurrentMeta,
} from '../src/content/currents';
import {
  CATEGORY_LIST,
  CATEGORY_META,
  PHILANTHROPY_SCENARIOS,
  STANCE_LIST,
  STANCE_META,
  getPresetScenarios,
} from '../src/content/scenarios';
import { RithmCurrentId, ScenarioCategory, Stance } from '../src/types/game';

describe('Philanthropy Scenarios & The 4 Currents', () => {
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
    it('contains exactly 20 curated scenarios with unique IDs', () => {
      expect(PHILANTHROPY_SCENARIOS).toHaveLength(20);
      const ids = new Set(PHILANTHROPY_SCENARIOS.map((s) => s.id));
      expect(ids.size).toBe(20);
    });

    it('distributes exactly 5 scenarios across each of the 4 domains', () => {
      const domains: ScenarioCategory[] = ['coworkers', 'grantees', 'community', 'life'];
      for (const domain of domains) {
        const matching = PHILANTHROPY_SCENARIOS.filter((s) => s.category === domain);
        expect(matching).toHaveLength(5);
        expect(CATEGORY_META[domain]).toBeDefined();
      }
    });

    it('ensures every scenario has complete, valid, non-empty fields', () => {
      for (const s of PHILANTHROPY_SCENARIOS) {
        expect(s.id.trim()).not.toBe('');
        expect(s.title.trim()).not.toBe('');
        expect(s.mobileSummary.trim()).not.toBe('');
        expect(s.prompt.trim()).not.toBe('');
        expect(s.twist.trim()).not.toBe('');
        expect(s.discussionQuestion.trim()).not.toBe('');
        expect(['coworkers', 'grantees', 'community', 'life']).toContain(s.category);
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

      // Every current has at least 4 scenarios
      expect(counts['current-01']).toBeGreaterThanOrEqual(4);
      expect(counts['current-02']).toBeGreaterThanOrEqual(4);
      expect(counts['current-03']).toBeGreaterThanOrEqual(4);
      expect(counts['current-04']).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Deck Presets', () => {
    it('generates spark-8 preset with 8 cards: 2 per domain, covering all 4 currents', () => {
      const spark8 = getPresetScenarios('spark-8');
      expect(spark8).toHaveLength(8);

      const catCounts: Record<ScenarioCategory, number> = {
        coworkers: 0,
        grantees: 0,
        community: 0,
        life: 0,
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

      expect(currentCounts['current-01']).toBeGreaterThanOrEqual(1);
      expect(currentCounts['current-02']).toBeGreaterThanOrEqual(1);
      expect(currentCounts['current-03']).toBeGreaterThanOrEqual(1);
      expect(currentCounts['current-04']).toBeGreaterThanOrEqual(1);
    });

    it('generates current-04-focus preset containing all Current 04 cards', () => {
      const c4Cards = getPresetScenarios('current-04-focus');
      expect(c4Cards.length).toBeGreaterThanOrEqual(6);
      expect(c4Cards.length).toBeLessThanOrEqual(8);

      const allC4 = PHILANTHROPY_SCENARIOS.filter((s) => s.currentId === 'current-04');
      for (const scenario of allC4) {
        expect(c4Cards.some((s) => s.id === scenario.id)).toBe(true);
      }
    });

    it('generates full-20 preset returning all 20 cards', () => {
      const full = getPresetScenarios('full-20');
      expect(full).toHaveLength(20);
    });

    it('generates custom preset filtering by categories', () => {
      const filtered = getPresetScenarios('custom', ['coworkers', 'grantees']);
      expect(filtered).toHaveLength(10);
      expect(filtered.every((s) => s.category === 'coworkers' || s.category === 'grantees')).toBe(true);

      const emptyCategories = getPresetScenarios('custom', []);
      expect(emptyCategories).toHaveLength(20);
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
});
