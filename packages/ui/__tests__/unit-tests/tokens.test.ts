import { describe, it, expect } from 'vitest';
import { spacing } from '../../src/tokens/spacing.token';
import { radius, borderWidth } from '../../src/tokens/border.token';
import { duration } from '../../src/tokens/motion.token';
import { fontWeight } from '../../src/tokens/typography.token';
import { fontSize, iconSize } from '../../src/tokens/font-size.token';
import { color } from '../../src/tokens/colors.tokens';
import { tint, tintOpacity } from '../../src/tokens/backgrounds.token';
import { COLOR_MODES, modeTokens, tokensFor } from '../../src/tokens/modes';
import { createAppTheme } from '../../src/theme';

describe('scales', () => {
  it('derives spacing from the 8px unit', () => {
    expect(spacing(1)).toBe(8);
    expect(spacing(3)).toBe(24);
  });

  it('scales radius sm < md < lg', () => {
    expect(radius.sm).toBeLessThan(radius.md);
    expect(radius.md).toBeLessThan(radius.lg);
  });

  it('scales duration fast < base < slow', () => {
    expect(duration.fast).toBeLessThan(duration.base);
    expect(duration.base).toBeLessThan(duration.slow);
  });

  it('rises monotonically through the type scale', () => {
    const sizes = Object.values(fontSize);
    const rising = sizes.every((size, index) => index === 0 || size > sizes[index - 1]);
    expect(rising).toBe(true);
  });

  it('sizes icons from the type scale', () => {
    const scale = new Set<number>(Object.values(fontSize));
    expect(Object.values(iconSize).every((size) => scale.has(size))).toBe(true);
  });

  it('draws every border from the hairline up', () => {
    expect(borderWidth.hairline).toBeLessThan(borderWidth.thick);
  });
});

describe('colours', () => {
  it('holds every hex in the ramps and nowhere else', () => {
    const hexes = Object.values(color)
      .filter((family) => typeof family === 'object')
      .flatMap((family) => Object.values(family));
    expect(hexes.length).toBeGreaterThan(0);
    expect(hexes.every((hex) => /^#[0-9a-f]{6}$/.test(hex))).toBe(true);
  });

  it('thins an accent to a wash without touching its hue', () => {
    expect(tint(color.blue[400], 'soft')).toBe(`rgba(79, 140, 255, ${tintOpacity.soft})`);
  });
});

describe('modes', () => {
  it('answers every semantic role in both modes', () => {
    const roles = (mode: (typeof COLOR_MODES)[number]) => JSON.stringify(tokensFor(mode));
    expect(Object.keys(modeTokens)).toEqual(['light', 'dark']);
    // Same shape, different values: the two modes must stay parallel.
    expect(roles('light')).not.toBe(roles('dark'));
  });

  it('inks a primary button against its own primary, not the other mode s', () => {
    expect(modeTokens.light.onPrimary).not.toBe(modeTokens.dark.onPrimary);
  });

  it.each(COLOR_MODES)('feeds the %s theme from the tokens', (mode) => {
    const theme = createAppTheme(mode);
    const tokens = tokensFor(mode);
    expect(theme.palette.primary.main).toBe(tokens.primary);
    expect(theme.palette.background.default).toBe(tokens.background.page);
    expect(theme.palette.text.secondary).toBe(tokens.text.secondary);
    expect(theme.palette.divider).toBe(tokens.divider);
  });

  it('matches the theme font weight scale', () => {
    const theme = createAppTheme('light');
    expect(theme.typography.fontWeightRegular).toBe(fontWeight.regular);
    expect(theme.typography.fontWeightMedium).toBe(fontWeight.medium);
    expect(theme.typography.fontWeightBold).toBe(fontWeight.bold);
  });
});
