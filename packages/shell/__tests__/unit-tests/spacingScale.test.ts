import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SPACING_STEPS } from '@exyconn/ui';

/**
 * Spacing is a scale, not a free number.
 *
 * A gap chosen by eye is invisible in review — 10px beside 12px looks fine in a diff and
 * looks wrong on the screen next to it — so the scale is asserted here instead, by reading
 * every portal source. `SPACING_STEPS` (packages/ui/src/tokens/spacing.token.ts) says what
 * the steps are and what each is for.
 */
const REPO_ROOT = join(__dirname, '../../../..');
const ROOTS = [join(REPO_ROOT, 'packages'), join(REPO_ROOT, 'exyconn-portal/apps')];
const SKIP = new Set(['node_modules', 'dist', 'coverage', '.turbo', 'cypress']);

/** The sx shorthands and the props that take a spacing factor. */
const SX_SPACING =
  /\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|rowGap|columnGap): ?(\d+(?:\.\d+)?)\b/g;
const SX_RESPONSIVE =
  /\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|rowGap|columnGap): \{([^}]*)\}/g;
const BREAKPOINT_VALUE = /\b(?:xs|sm|md|lg|xl): ?(\d+(?:\.\d+)?)\b/g;
const SPACING_PROP = /spacing=\{(\d+(?:\.\d+)?)\}/g;

const steps = new Set<number>(SPACING_STEPS);

/**
 * Zero is "no space at all", which is a decision rather than a step on the scale, and a whole
 * number above the scale is a size rather than rhythm — the 48px breathing room around an
 * empty state, say. Both are still on the 8px grid. What this refuses is a fraction that is
 * not the 4px half-step: 1.25, 0.75, 2.5 and the rest of the drift.
 */
const allowed = (value: number) => Number.isInteger(value) || steps.has(value);

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) {
      continue;
    }
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      found.push(...sourceFiles(path));
    } else if (/\.tsx?$/.test(entry) && !entry.endsWith('.d.ts')) {
      found.push(path);
    }
  }
  return found;
}

/** Every off-scale spacing value in one file, as `path:value` for a readable failure. */
function offScale(path: string): string[] {
  const source = readFileSync(path, 'utf8');
  const values: number[] = [];
  for (const match of source.matchAll(SX_SPACING)) {
    values.push(Number(match[1]));
  }
  for (const match of source.matchAll(SPACING_PROP)) {
    values.push(Number(match[1]));
  }
  for (const match of source.matchAll(SX_RESPONSIVE)) {
    for (const inner of match[1].matchAll(BREAKPOINT_VALUE)) {
      values.push(Number(inner[1]));
    }
  }
  const relative = path.slice(REPO_ROOT.length + 1);
  return values.filter((value) => !allowed(value)).map((value) => `${relative}: ${value}`);
}

describe('spacing scale', () => {
  const files = ROOTS.flatMap(sourceFiles);

  it('reads a portal source for every package and app', () => {
    // A guard on the guard: a broken walk would pass this suite by finding nothing to check.
    expect(files.length).toBeGreaterThan(500);
  });

  it('uses only the steps the scale declares', () => {
    // Whole numbers above the scale are sizes, not rhythm — a py: 6 empty state, say — and
    // those are still on the 8px grid. Only fractions off the half-step are reported.
    expect(files.flatMap(offScale)).toEqual([]);
  });
});

describe('panel padding', () => {
  it('is decided by the named surfaces, not at the call site', () => {
    // This file describes the pattern it forbids, so it would otherwise report itself.
    const sources = ROOTS.flatMap(sourceFiles).filter((path) => !path.includes('__tests__'));
    // `glass` is the bare surface; a panel with padding of its own is `panel`, `densePanel`
    // or `readingPanel`. Two call sites deliberately compose the bare one with other styles.
    const adHoc = sources.filter((path) =>
      /\[glass,\s*\{[^}]*\bp:/.test(readFileSync(path, 'utf8')),
    );

    expect(adHoc.map((path) => path.slice(REPO_ROOT.length + 1))).toEqual([]);
  });
});
