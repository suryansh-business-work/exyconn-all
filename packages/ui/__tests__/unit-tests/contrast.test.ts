import { describe, expect, it } from 'vitest';
import {
  AA_LARGE,
  AA_TEXT,
  contrastRatio,
  ensureContrast,
  readableInk,
} from '../../src/a11y/contrast';
import { COLOR_MODES, tokensFor } from '../../src/tokens/modes';

/**
 * WCAG 2.2 AA, SC 1.4.3: every colour the design system lays text in, on every surface it is
 * laid on, in both modes, at 4.5:1. A token that drifts below it fails here, before anybody
 * has to notice a grey they cannot read.
 */
describe.each(COLOR_MODES)('%s mode', (mode) => {
  const t = tokensFor(mode);
  const surfaces = { page: t.background.page, panel: t.background.panel };

  const inks: Record<string, string> = {
    'text.primary': t.text.primary,
    'text.secondary': t.text.secondary,
    primary: t.primary,
    secondary: t.secondary,
    success: t.success,
    warning: t.warning,
    error: t.error,
  };

  for (const [inkName, ink] of Object.entries(inks)) {
    for (const [surfaceName, surface] of Object.entries(surfaces)) {
      it(`${inkName} on ${surfaceName} is readable (${ink} on ${surface})`, () => {
        expect(contrastRatio(ink, surface)).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }

  it('onPrimary on primary is readable — the text on every filled primary button', () => {
    expect(contrastRatio(t.onPrimary, t.primary)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe('the contrast arithmetic itself', () => {
  it('matches the WCAG reference points', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    // The classic AA boundary grey on white.
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(AA_TEXT);
  });

  it('picks the ink that reads on a colour nobody chose in advance', () => {
    expect(readableInk('#ffeb3b')).toBe('#111111');
    expect(readableInk('#1a237e')).toBe('#ffffff');
  });
});

describe('a colour an administrator chose', () => {
  it('comes back unchanged when it already reads', () => {
    expect(ensureContrast('#1a237e', '#ffffff')).toBe('#1a237e');
  });

  it('is darkened just enough to read on a light surface, keeping its hue', () => {
    const adjusted = ensureContrast('#ffb74d', '#ffffff');
    expect(contrastRatio(adjusted, '#ffffff')).toBeGreaterThanOrEqual(AA_TEXT);
    // Still an orange: red stays the strongest channel.
    const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(adjusted.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
  });

  it('is lightened on a dark surface', () => {
    const adjusted = ensureContrast('#3949ab', '#1f1f1f');
    expect(contrastRatio(adjusted, '#1f1f1f')).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe.each(COLOR_MODES)('the edge of a text field, %s mode', (mode) => {
  // SC 1.4.11: the outline that shows where a field is needs 3:1 against the panel it sits on.
  it('is visible on the panel', () => {
    const t = tokensFor(mode);
    expect(contrastRatio(t.text.secondary, t.background.panel)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
