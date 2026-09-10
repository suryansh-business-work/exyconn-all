import { describe, expect, it } from 'vitest';
import { createAppTheme, type ColorMode } from '../../src/theme/createAppTheme';

/** Relative luminance, per WCAG 2.1. */
function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => Number.parseInt(value.slice(i, i + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** WCAG contrast ratio between two opaque colours. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The floor for body text. Anything below this is unreadable for somebody. */
const AA = 4.5;

const MODES: ColorMode[] = ['light', 'dark'];

describe('theme contrast', () => {
  it.each(MODES)('keeps %s-mode text readable on both surfaces', (mode) => {
    const { palette } = createAppTheme(mode);
    for (const surface of [palette.background.paper, palette.background.default]) {
      expect(contrast(palette.text.primary, surface)).toBeGreaterThanOrEqual(AA);
      // Secondary text carries real information — labels, hints, timestamps — so it is
      // held to the same floor as body text rather than the large-text exemption.
      expect(contrast(palette.text.secondary, surface)).toBeGreaterThanOrEqual(AA);
    }
  });

  it.each(MODES)('keeps every %s-mode status colour readable on paper', (mode) => {
    const { palette } = createAppTheme(mode);
    const paper = palette.background.paper;
    for (const colour of [
      palette.primary.main,
      palette.success.main,
      palette.warning.main,
      palette.error.main,
    ]) {
      expect(contrast(colour, paper)).toBeGreaterThanOrEqual(AA);
    }
  });

  it('keeps a primary button legible in both modes', () => {
    for (const mode of MODES) {
      const { palette } = createAppTheme(mode);
      expect(contrast(palette.primary.contrastText, palette.primary.main)).toBeGreaterThanOrEqual(
        AA,
      );
    }
  });
});

describe('theme tokens', () => {
  it('asks for Inter first, with a fallback on every platform', () => {
    const { typography } = createAppTheme('light');
    expect(typography.fontFamily).toMatch(/^"Inter"/);
    expect(typography.fontFamily).toContain('system-ui');
  });

  it('lines up digits in table cells, so money columns do not read ragged', () => {
    const cell = createAppTheme('light').components?.MuiTableCell?.styleOverrides?.root;
    expect(cell).toMatchObject({ fontVariantNumeric: expect.stringContaining('tabular-nums') });
  });
});
