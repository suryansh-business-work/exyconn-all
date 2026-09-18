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
  /** Where text also sits: a hovered or current row, the tab track, a badge, the sidebar. */
  const everySurface = {
    ...surfaces,
    muted: t.background.muted,
    sidebar: t.background.sidebar,
  };

  for (const [inkName, ink] of Object.entries({
    'text.primary': t.text.primary,
    'text.secondary': t.text.secondary,
  })) {
    for (const [surfaceName, surface] of Object.entries(everySurface)) {
      it(`${inkName} on ${surfaceName} is readable (${ink} on ${surface})`, () => {
        expect(contrastRatio(ink, surface)).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }

  const inks: Record<string, string> = {
    primary: t.primary,
    secondary: t.secondary,
    success: t.success,
    warning: t.warning,
    error: t.error,
    info: t.info,
  };

  for (const [inkName, ink] of Object.entries(inks)) {
    for (const [surfaceName, surface] of Object.entries(surfaces)) {
      it(`${inkName} on ${surfaceName} is readable (${ink} on ${surface})`, () => {
        expect(contrastRatio(ink, surface)).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }

  it('onPrimary on primary is readable — every filled button and every tooltip', () => {
    expect(contrastRatio(t.onPrimary, t.primary)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  // SC 1.4.11 / 2.4.7: the focus ring has to be seen on whatever the focused control sits on.
  for (const [surfaceName, surface] of Object.entries(everySurface)) {
    it(`the focus ring stands out on ${surfaceName}`, () => {
      expect(contrastRatio(t.ring, surface)).toBeGreaterThanOrEqual(AA_LARGE);
    });
  }
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

describe.each(COLOR_MODES)('the edge of a control, %s mode', (mode) => {
  // SC 1.4.11: a text field's outline and an unchecked switch's track are the only things
  // that show where the control is, so they need 3:1 against every ground a control sits on.
  const t = tokensFor(mode);
  it.each([
    ['page', t.background.page],
    ['panel', t.background.panel],
    ['sidebar', t.background.sidebar],
  ])('is visible on the %s', (_name, surface) => {
    expect(contrastRatio(t.control, surface)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
