import { describe, expect, it } from 'vitest';
import { createAppTheme } from '../../src/theme';
import { COLOR_MODES, tokensFor } from '../../src/tokens/modes';
import { canvasDots, dottedCanvas, scrim, tint } from '../../src/tokens/backgrounds.token';
import { focusRing, glow } from '../../src/tokens/box-shadow.token';
import { enterAnimation, staggerDelay } from '../../src/tokens/motion.token';
import { BASE_RADIUS, CARD_RADIUS } from '../../src/tokens/border.token';
import { fuchsia, onyx, sky, yellow } from '../../src/tokens/colors.tokens';

type StyleFn = (args: {
  ownerState: Record<string, unknown>;
  theme: unknown;
}) => Record<string, unknown>;

/** One MUI family's override callback, so each branch of it can be called in both modes. */
function override(mode: 'light' | 'dark', family: string, slot: string): StyleFn {
  const theme = createAppTheme(mode);
  const components = theme.components as Record<
    string,
    { styleOverrides?: Record<string, unknown> }
  >;
  const fn = components[family]?.styleOverrides?.[slot];
  if (typeof fn !== 'function') {
    throw new Error(`${family}.${slot} is not a style function`);
  }
  return (args) => (fn as StyleFn)({ ...args, theme });
}

/**
 * Every override that branches on how a component is used, driven through each branch in
 * BOTH modes. Light and dark are separate token files; a branch that reads a token nobody
 * exercised in one mode is how a dark-only bug ships, so coverage is held at 100% for the
 * tokens and the theme (vite.config.ts), and this is the file that earns it.
 */
describe.each(COLOR_MODES)('%s mode overrides', (mode) => {
  const t = tokensFor(mode);

  it('dresses a neutral chip in the muted surface, an outlined one in the hairline', () => {
    const chip = override(mode, 'MuiChip', 'root');
    expect(
      chip({ ownerState: { color: 'default', variant: 'filled' }, theme: null }),
    ).toMatchObject({ backgroundColor: t.background.muted, color: t.text.primary });
    expect(
      chip({ ownerState: { color: 'default', variant: 'outlined' }, theme: null }),
    ).toMatchObject({ borderColor: t.divider });
    expect(chip({ ownerState: { color: 'primary' }, theme: null })).not.toHaveProperty(
      'backgroundColor',
    );
    const remove = override(mode, 'MuiChip', 'deleteIcon');
    expect(remove({ ownerState: { color: 'default' }, theme: null })).toMatchObject({
      color: t.text.secondary,
    });
    expect(remove({ ownerState: { color: 'primary' }, theme: null })).toEqual({});
  });

  it('gives an alert a hairline in its own hue unless it is filled', () => {
    const alert = override(mode, 'MuiAlert', 'root');
    expect(
      alert({ ownerState: { variant: 'standard', severity: 'error' }, theme: null }),
    ).toHaveProperty('border');
    expect(
      alert({ ownerState: { variant: 'filled', color: 'success' }, theme: null }),
    ).not.toHaveProperty('border');
    // Neither a colour nor a severity: the hue falls back to success.
    expect(alert({ ownerState: {}, theme: null })).toHaveProperty('border');
  });

  it('draws the primary button per variant and leaves the others to MUI', () => {
    const button = override(mode, 'MuiButton', 'root');
    for (const variant of ['contained', 'outlined', 'text', undefined]) {
      expect(button({ ownerState: { color: 'primary', variant }, theme: null })).toHaveProperty(
        '&:hover',
      );
    }
    expect(
      button({ ownerState: { color: 'secondary', variant: 'contained' }, theme: null }),
    ).not.toHaveProperty('&:hover');
  });

  it('lights a hovered primary button on the dark canvas, shadows it on the light one', () => {
    const button = override(mode, 'MuiButton', 'root');
    const hover = button({ ownerState: { color: 'primary', variant: 'contained' }, theme: null })[
      '&:hover'
    ] as Record<string, string>;
    expect(hover.boxShadow).toBe(mode === 'dark' ? glow(t.primary) : t.shadow.xs);
  });

  it('colours a switch by its own palette entry, defaulting to primary', () => {
    const base = override(mode, 'MuiSwitch', 'switchBase');
    for (const color of ['default', 'secondary', undefined]) {
      expect(base({ ownerState: { color }, theme: null })).toHaveProperty('&.Mui-checked');
    }
  });

  it('lets a full-width tab strip keep its width and hugs every other one', () => {
    const tabs = override(mode, 'MuiTabs', 'root');
    expect(tabs({ ownerState: { variant: 'fullWidth' }, theme: null })).not.toHaveProperty('width');
    expect(tabs({ ownerState: { variant: 'scrollable' }, theme: null })).toMatchObject({
      width: 'fit-content',
    });
  });

  it('sets a menu row in the small body size', () => {
    const row = override(mode, 'MuiMenuItem', 'root');
    expect(row({ ownerState: {}, theme: null })).toHaveProperty('fontSize');
  });

  it('paints the page as a dotted canvas in the divider colour', () => {
    const baseline = createAppTheme(mode).components?.MuiCssBaseline?.styleOverrides as Record<
      string,
      Record<string, string>
    >;
    expect(baseline.body).toMatchObject({
      backgroundColor: t.background.page,
      ...dottedCanvas(t.divider),
    });
  });
});

describe('the reference palette', () => {
  it('wears the accents as drawn on the dark grounds and takes them down for the light', () => {
    expect(tokensFor('dark')).toMatchObject({
      primary: sky[300],
      secondary: fuchsia[300],
      ring: yellow[300],
      background: { page: onyx[950] },
    });
    expect(tokensFor('light')).toMatchObject({
      primary: sky[700],
      secondary: fuchsia[700],
      background: { page: '#ffffff' },
    });
  });

  it('rounds controls at 12 and cards at 20, as the reference draws them', () => {
    expect(BASE_RADIUS).toBe(12);
    expect(CARD_RADIUS).toBe(20);
  });

  it('spaces the canvas dots three spacing units apart', () => {
    const css = dottedCanvas('#123456');
    expect(css.backgroundSize).toBe(`${canvasDots.pitch}px ${canvasDots.pitch}px`);
    expect(css.backgroundImage).toContain('#123456');
  });

  it('glows in the accent, with a hairline edge and a wide bloom', () => {
    const shadow = glow('#6db5ff');
    expect(shadow).toContain('0 0 0 1px');
    expect(shadow).toContain('0 8px 32px');
    expect(focusRing('#6db5ff')).toBe('0 0 0 1px #6db5ff');
  });

  it('thins and dims with their defaults', () => {
    expect(tint('#6db5ff')).toBe('rgba(109, 181, 255, 0.08)');
    expect(scrim()).toBe('rgba(0, 0, 0, 0.6)');
  });

  it('staggers a list and stops staggering after the eighth item', () => {
    expect(staggerDelay(0)).toBe('0ms');
    expect(staggerDelay(3)).toBe('90ms');
    expect(staggerDelay(50)).toBe('240ms');
    expect(enterAnimation.item).toContain('backwards');
  });
});
