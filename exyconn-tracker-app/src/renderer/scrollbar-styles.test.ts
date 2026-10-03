import { describe, expect, it } from 'vitest';
import { buildTheme } from './theme';
import { scrollbarGlobalStyles } from './scrollbar-styles';

describe('scrollbarGlobalStyles', () => {
  it.each(['light', 'dark'] as const)('follows the %s theme instead of the OS', (mode) => {
    const theme = buildTheme(null, mode);
    const styles = scrollbarGlobalStyles(theme);
    expect(styles.html.colorScheme).toBe(mode);
    expect(styles.html.scrollbarColor).toMatch(/ transparent$/);
    expect(styles['*'].scrollbarWidth).toBe('thin');
  });

  it('draws the thumb in the text colour, so it differs between the two themes', () => {
    const light = scrollbarGlobalStyles(buildTheme(null, 'light')).html.scrollbarColor;
    const dark = scrollbarGlobalStyles(buildTheme(null, 'dark')).html.scrollbarColor;
    expect(light).not.toBe(dark);
  });
});
