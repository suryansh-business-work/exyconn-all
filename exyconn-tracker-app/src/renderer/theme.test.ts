import { describe, it, expect } from 'vitest';
import { AA_TEXT, contrastRatio } from '@exyconn/ui';
import { buildTheme } from './theme';
import { color } from '@exyconn/ui';

/** A workspace whose brand background is light, so `system` would resolve to a light palette. */
const LIGHT_BRAND = {
  primaryColor: color.indigo[500],
  secondaryColor: color.teal[400],
  backgroundColor: color.white,
  textColor: '#111111',
} as never;

describe('buildTheme light/dark', () => {
  it('follows the OS when the mode is system', () => {
    expect(buildTheme(null, 'system', true).palette.mode).toBe('dark');
    expect(buildTheme(LIGHT_BRAND, 'system', false).palette.mode).toBe('light');
  });

  it('lets an explicit choice overrule both the OS and the brand', () => {
    // The employee's screen is theirs; a light brand must not force a light app on them.
    expect(buildTheme(LIGHT_BRAND, 'dark', false).palette.mode).toBe('dark');
    expect(buildTheme(null, 'light', true).palette.mode).toBe('light');
  });

  it('defaults to the workspace brand when nothing is asked for', () => {
    // The Exyconn fallback background is dark, so this is the behaviour that already existed.
    expect(buildTheme(null).palette.mode).toBe('dark');
  });
});

describe('the brand, whatever the workspace picked (WCAG 2.2 AA)', () => {
  const brands = ['#fff176', '#0b1026', color.indigo[500]];

  for (const primaryColor of brands) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${primaryColor} reads as text on the ${mode} panel, with readable ink on it`, () => {
        // The fixture is typed `never` above; its fields are plain strings.
        const brand = { ...(LIGHT_BRAND as Record<string, string>), primaryColor } as never;
        const theme = buildTheme(brand, mode);
        const { primary, background } = theme.palette;
        expect(contrastRatio(primary.main, background.paper)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrastRatio(primary.contrastText, primary.main)).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }
});
