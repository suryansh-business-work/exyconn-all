/**
 * Registry integrity suite.
 *
 * Guards the three sources of truth that must stay in lockstep:
 *   1. `toolsData`   — the category/tool registry driving the grid + routes
 *   2. `src/tools/*` — the actual tool implementations on disk
 *   3. `toolDetails` — the SEO/content payload keyed by tool id
 *
 * Runs in the vitest node process, so `node:fs` / `node:path` are available.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toolsData, getAllTools, getCategories, getToolCounts, findToolById, getCategoryOfTool, getToolsByCategory } from '../shared/data/toolsData';
import { toolDetails } from '../shared/data/toolDetails';

const EXPECTED_CATEGORIES = [
  'Business & Utility Tools',
  'AI Writing Tools',
  'AI Prompt & Generator Tools',
  'AI Chat Tools',
  'FAQ & Support Tools',
  'SEO Tools',
  'Sitemap Tools',
  'Website & URL Tools',
  'Domain & Network Tools',
  'File & Data Converter Tools',
  'PDF Tools',
  'Image Tools',
];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const TOOLS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'tools');

const allTools = getAllTools();

const readToolFolders = (): string[] =>
  fs
    .readdirSync(TOOLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

describe('toolsData registry', () => {
  it('exposes exactly the 12 expected categories, in order', () => {
    expect(toolsData.map((cat) => cat.category)).toEqual(EXPECTED_CATEGORIES);
  });

  it('reports a category count of 12 and ~130 tools', () => {
    const counts = getToolCounts();
    expect(counts.categories).toBe(12);
    expect(counts.total).toBeGreaterThanOrEqual(125);
    expect(counts.total).toBeLessThanOrEqual(140);
    expect(counts.total).toBe(allTools.length);
  });

  it('prefixes the category list with "All"', () => {
    expect(getCategories()).toEqual(['All', ...EXPECTED_CATEGORIES]);
  });

  it('has no empty category', () => {
    const empty = toolsData.filter((cat) => cat.items.length === 0).map((cat) => cat.category);
    expect(empty).toEqual([]);
  });

  it('gives every category a name, an icon and a hex color', () => {
    const bad = toolsData
      .filter((cat) => !cat.category || !cat.icon || !HEX_COLOR.test(cat.color))
      .map((cat) => cat.category);
    expect(bad).toEqual([]);
  });

  it('has unique tool ids across every category', () => {
    const ids = allTools.map((tool) => tool.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicates).toEqual([]);
  });

  it('derives every tool url from its id', () => {
    const mismatched = allTools
      .filter((tool) => tool.url !== `/tools/${tool.id}`)
      .map((tool) => `${tool.id} -> ${tool.url}`);
    expect(mismatched).toEqual([]);
  });

  it('gives every tool a name, an icon and a hex color', () => {
    const bad = allTools
      .filter((tool) => !tool.name || !tool.icon || !HEX_COLOR.test(tool.color))
      .map((tool) => tool.id);
    expect(bad).toEqual([]);
  });

  it('keeps every tool description between 40 and 200 characters', () => {
    const bad = allTools
      .filter((tool) => tool.description.length < 40 || tool.description.length > 200)
      .map((tool) => `${tool.id} (${tool.description.length})`);
    expect(bad).toEqual([]);
  });

  it('resolves every tool through findToolById and getCategoryOfTool', () => {
    const unresolved = allTools
      .filter((tool) => findToolById(tool.id)?.id !== tool.id || !getCategoryOfTool(tool.id))
      .map((tool) => tool.id);
    expect(unresolved).toEqual([]);
  });

  it('returns the full list for the "All" pseudo-category', () => {
    expect(getToolsByCategory('All')).toHaveLength(allTools.length);
    expect(getToolsByCategory('Not A Category')).toEqual([]);
  });
});

describe('registry <-> filesystem consistency', () => {
  it('has a src/tools/<id>/index.tsx for every registered tool', () => {
    const missingFolders = allTools
      .filter((tool) => !fs.existsSync(path.join(TOOLS_DIR, tool.id, 'index.tsx')))
      .map((tool) => tool.id);
    expect(missingFolders).toEqual([]);
  });

  it('registers every folder found under src/tools/', () => {
    const registered = new Set(allTools.map((tool) => tool.id));
    const unregistered = readToolFolders().filter((folder) => !registered.has(folder));
    expect(unregistered).toEqual([]);
  });

  it('has the same number of tool folders as registered tools', () => {
    expect(readToolFolders()).toHaveLength(allTools.length);
  });
});

describe('toolDetails content coverage', () => {
  it('has a details entry for every registered tool', () => {
    const missing = allTools.filter((tool) => !toolDetails[tool.id]).map((tool) => tool.id);
    expect(missing).toEqual([]);
  });

  it('has no orphan details entry without a registered tool', () => {
    const registered = new Set(allTools.map((tool) => tool.id));
    const orphans = Object.keys(toolDetails).filter((id) => !registered.has(id));
    expect(orphans).toEqual([]);
  });
});

describe.each(allTools.map((tool) => [tool.id, tool.name] as const))(
  'content for %s',
  (id) => {
    const details = toolDetails[id];

    it('exists', () => {
      expect(details).toBeDefined();
    });

    it('has 2-3 longDescription paragraphs of at least 200 chars each', () => {
      expect(details.longDescription.length).toBeGreaterThanOrEqual(2);
      expect(details.longDescription.length).toBeLessThanOrEqual(3);
      const short = details.longDescription
        .map((paragraph, index) => ({ index, length: paragraph.length }))
        .filter((entry) => entry.length < 200);
      expect(short).toEqual([]);
    });

    it('has 4-8 features', () => {
      expect(details.features.length).toBeGreaterThanOrEqual(4);
      expect(details.features.length).toBeLessThanOrEqual(8);
      expect(details.features.every((feature) => feature.trim().length > 0)).toBe(true);
    });

    it('has 3-6 use cases', () => {
      expect(details.useCases.length).toBeGreaterThanOrEqual(3);
      expect(details.useCases.length).toBeLessThanOrEqual(6);
      expect(details.useCases.every((useCase) => useCase.trim().length > 0)).toBe(true);
    });

    it('has 3-6 howTo steps', () => {
      expect(details.howTo.length).toBeGreaterThanOrEqual(3);
      expect(details.howTo.length).toBeLessThanOrEqual(6);
      expect(details.howTo.every((step) => step.trim().length > 0)).toBe(true);
    });

    it('has 4-6 faqs, each answered in at least 40 chars', () => {
      expect(details.faqs.length).toBeGreaterThanOrEqual(4);
      expect(details.faqs.length).toBeLessThanOrEqual(6);
      const weak = details.faqs
        .filter((faq) => !faq.question.trim() || faq.answer.length < 40)
        .map((faq) => faq.question);
      expect(weak).toEqual([]);
    });

    it('has 5-10 keywords', () => {
      expect(details.keywords.length).toBeGreaterThanOrEqual(5);
      expect(details.keywords.length).toBeLessThanOrEqual(10);
      expect(details.keywords.every((keyword) => keyword.trim().length > 0)).toBe(true);
    });

    it('has a metaDescription of 100-165 chars', () => {
      expect(details.metaDescription.length).toBeGreaterThanOrEqual(100);
      expect(details.metaDescription.length).toBeLessThanOrEqual(165);
    });
  },
);
