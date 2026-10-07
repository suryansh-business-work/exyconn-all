import { describe, expect, it } from 'vitest';
import { useThemeColor, type ThemeColor } from '../../../src/theme/useThemeColor';
import { CHROME } from '../../../src/theme/palette';
import { renderHookWithProviders } from '../test-utils';

describe('useThemeColor', () => {
  it('reads a chrome colour as a raw value in the light scheme', () => {
    const { result } = renderHookWithProviders(() => useThemeColor('ink'), {
      themeMode: 'light',
    });
    expect(result.current).toBe(CHROME.light.ink);
  });

  it('follows the dark scheme', () => {
    const { result } = renderHookWithProviders(() => useThemeColor('error'), {
      themeMode: 'dark',
    });
    expect(result.current).toBe(CHROME.dark.error);
  });

  it('reads an empty string for a colour the theme does not define', () => {
    const { result } = renderHookWithProviders(() => useThemeColor('not-a-colour' as ThemeColor), {
      themeMode: 'light',
    });
    expect(result.current).toBe('');
  });
});
