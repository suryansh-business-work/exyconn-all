import { describe, expect, it } from 'vitest';
import config from '../../../src/theme/tamagui.config';
import { CHROME } from '../../../src/theme/palette';

type ThemeValues = Record<string, unknown>;

function valueOf(theme: ThemeValues, key: string): unknown {
  const entry = theme[key];
  if (typeof entry === 'object' && entry !== null && 'val' in entry) {
    return (entry as { val: unknown }).val;
  }
  return entry;
}

describe('the Tamagui config', () => {
  it('defines only the light and dark themes, each carrying the tracker’s chrome', () => {
    const themes = config.themes as unknown as Record<string, ThemeValues>;
    for (const scheme of ['light', 'dark'] as const) {
      const theme = themes[scheme];
      const chrome = CHROME[scheme];
      expect(valueOf(theme, 'background')).toBe(chrome.app);
      expect(valueOf(theme, 'backgroundStrong')).toBe(chrome.paper);
      expect(valueOf(theme, 'color')).toBe(chrome.ink);
      expect(valueOf(theme, 'borderColor')).toBe(chrome.hairline);
      expect(valueOf(theme, 'placeholderColor')).toBe(chrome.muted);
      for (const key of ['app', 'paper', 'ink', 'muted', 'hairline', 'control'] as const) {
        expect(valueOf(theme, key)).toBe(chrome[key]);
      }
      for (const key of ['success', 'warning', 'error'] as const) {
        expect(valueOf(theme, key)).toBe(chrome[key]);
      }
    }
  });

  it('uses the Inter fonts and full prop names', () => {
    expect(Object.keys(config.fonts)).toEqual(expect.arrayContaining(['body', 'heading']));
    expect(config.settings.onlyAllowShorthands).toBe(false);
  });
});
