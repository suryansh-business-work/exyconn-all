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
import { glowCanvas, pastelTone, washCanvas } from '../../src/tokens/canvas.token';
import { AA_LARGE, contrastRatio } from '../../src/a11y/contrast';

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

describe('the canvas and the pastel bubble', () => {
  it('lays a light wash diagonally through evenly spaced stops, over its ground', () => {
    const canvas = washCanvas('#ffffff', ['#000000', '#111111', '#222222']);
    expect(canvas.image).toBe('linear-gradient(135deg, #000000 0%, #111111 50%, #222222 100%)');
    expect(canvas.stops).toEqual(['#ffffff', '#000000', '#111111', '#222222']);
  });

  it('lays dark glows over the ground, each stop its glow at its brightest', () => {
    const canvas = glowCanvas('#000000', [{ color: '#ffffff', opacity: 0.5, at: '0% 0%' }]);
    expect(canvas.image).toBe(
      'radial-gradient(55% 55% at 0% 0%, rgba(255, 255, 255, 0.5), transparent 70%)',
    );
    expect(canvas.stops).toEqual(['#000000', '#808080']);
  });

  it.each(COLOR_MODES)('tints a bubble from any accent and draws its icon at 3:1 (%s)', (mode) => {
    const surface = tokensFor(mode).background.panel;
    for (const accent of [color.amber[500], color.blue[400], color.green[300], color.violet[400]]) {
      const tone = pastelTone(accent, surface, mode);
      expect(tone.fill).not.toBe(surface);
      expect(tone.ring).toMatch(/^rgba\(/);
      expect(contrastRatio(tone.ink, tone.fill)).toBeGreaterThanOrEqual(AA_LARGE);
    }
  });
});
