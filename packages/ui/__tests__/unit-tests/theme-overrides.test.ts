import { describe, expect, it } from 'vitest';
import { createAppTheme } from '../../src/theme';
import { COLOR_MODES, tokensFor } from '../../src/tokens/modes';
import { scrim, tint } from '../../src/tokens/backgrounds.token';
import { focusRing } from '../../src/tokens/box-shadow.token';
import { enterAnimation, staggerDelay } from '../../src/tokens/motion.token';
import {
  BASE_RADIUS,
  CARD_RADIUS,
  DIALOG_RADIUS,
  FLOATING_RADIUS,
  FRAME_RADIUS,
} from '../../src/tokens/border.token';
import { mist, night, orange, white } from '../../src/tokens/colors.tokens';
import { AA_TEXT, contrastRatio } from '../../src/a11y/contrast';

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
    throw new TypeError(`${family}.${slot} is not a style function`);
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
    // No colour at all reads as the neutral chip.
    expect(chip({ ownerState: {}, theme: null })).toMatchObject({
      backgroundColor: t.background.muted,
    });
    expect(
      chip({ ownerState: { color: 'primary', variant: 'outlined' }, theme: null }),
    ).not.toHaveProperty('backgroundColor');
    const remove = override(mode, 'MuiChip', 'deleteIcon');
    expect(remove({ ownerState: { color: 'default' }, theme: null })).toMatchObject({
      color: t.text.secondary,
    });
    expect(remove({ ownerState: { color: 'primary' }, theme: null })).toMatchObject({
      color: 'inherit',
    });
  });

  it('dresses a coloured chip as a readable pastel pill', () => {
    const chip = override(mode, 'MuiChip', 'root');
    for (const color of ['primary', 'secondary', 'success', 'warning', 'error', 'info']) {
      const style = chip({ ownerState: { color, variant: 'filled' }, theme: null });
      expect(style.borderRadius).toBe('9999px');
      const fill = style.backgroundColor as string;
      expect(fill).not.toBe(t.background.panel);
      expect(contrastRatio(style.color as string, fill)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('deepens a clickable pastel chip on hover and focus, keeping its label readable', () => {
    const chip = override(mode, 'MuiChip', 'root');
    for (const color of ['primary', 'secondary', 'success', 'warning', 'error', 'info']) {
      const style = chip({ ownerState: { color, variant: 'filled' }, theme: null });
      const active = style['&.MuiChip-clickable:hover, &.MuiChip-clickable.Mui-focusVisible'] as
        Record<string, string> | undefined;
      expect(active).toBeDefined();
      // A deeper tint than at rest, not MUI's solid main, which hid the label.
      expect(active?.backgroundColor).not.toBe(style.backgroundColor);
      expect(active?.backgroundColor).not.toBe(createAppTheme(mode).palette[color as 'info'].main);
      expect(
        contrastRatio(active?.color as string, active?.backgroundColor as string),
      ).toBeGreaterThanOrEqual(AA_TEXT);
    }
    // The neutral chip keeps MUI's own hover.
    const neutral = chip({ ownerState: { color: 'default', variant: 'filled' }, theme: null });
    expect(neutral).not.toHaveProperty(
      '&.MuiChip-clickable:hover, &.MuiChip-clickable.Mui-focusVisible',
    );
  });

  it('frosts a modal backdrop and leaves an invisible one alone', () => {
    const backdrop = override(mode, 'MuiBackdrop', 'root');
    expect(backdrop({ ownerState: { invisible: true }, theme: null })).toEqual({});
    expect(backdrop({ ownerState: { invisible: false }, theme: null })).toHaveProperty(
      'backdropFilter',
    );
  });

  it('makes a card frosted glass that turns solid when transparency is unwelcome', () => {
    const card = createAppTheme(mode).components?.MuiCard?.styleOverrides?.root as Record<
      string,
      unknown
    >;
    expect(card).toMatchObject({
      backgroundColor: t.glass.card,
      borderRadius: `${CARD_RADIUS}px`,
      boxShadow: t.shadow.sm,
    });
    const solid = Object.entries(card).find(([key]) => key.startsWith('@media'));
    expect(solid?.[0]).toContain('prefers-reduced-transparency');
    expect(solid?.[1]).toMatchObject({ backgroundColor: t.background.panel });
  });

  it('wears the glossy pastel pill on the current list row, its icon in the accent', () => {
    const row = createAppTheme(mode).components?.MuiListItemButton?.styleOverrides?.root as Record<
      string,
      Record<string, string>
    >;
    const current = row['&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible'];
    expect(current.backgroundImage).toContain(t.selected.top);
    expect(current.color).toBe(t.selected.ink);
    expect(row['&.Mui-selected .MuiListItemIcon-root'].color).toBe(t.selected.icon);
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

  it('lifts a hovered primary button with the card shadow', () => {
    const button = override(mode, 'MuiButton', 'root');
    const hover = button({ ownerState: { color: 'primary', variant: 'contained' }, theme: null })[
      '&:hover'
    ] as Record<string, string>;
    expect(hover.boxShadow).toBe(t.shadow.sm);
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

  it('paints the page as the pastel canvas over its solid ground', () => {
    const baseline = createAppTheme(mode).components?.MuiCssBaseline?.styleOverrides as Record<
      string,
      Record<string, Record<string, string>>
    >;
    expect(baseline.body).toMatchObject({ backgroundColor: t.background.page });
    expect(baseline.body['&::before']).toMatchObject({
      position: 'fixed',
      backgroundImage: t.canvas.image,
    });
  });
});

describe('the portal palette', () => {
  it('puts frosted cards on a pastel canvas by day and a navy night, inverting the ink accent', () => {
    expect(tokensFor('light')).toMatchObject({
      primary: mist[850],
      onPrimary: white,
      secondary: orange[900],
      background: { page: mist[75], panel: white },
      glass: { card: 'rgba(255, 255, 255, 0.72)' },
    });
    expect(tokensFor('dark')).toMatchObject({
      primary: mist[100],
      onPrimary: mist[950],
      secondary: orange[200],
      background: { page: night[950], panel: night[900] },
    });
  });

  it('rounds controls, cards, floating panels, dialogs and the frame on one rising scale', () => {
    expect(BASE_RADIUS).toBe(12);
    expect(FLOATING_RADIUS).toBe(16);
    expect(CARD_RADIUS).toBe(20);
    expect(DIALOG_RADIUS).toBe(24);
    expect(FRAME_RADIUS).toBe(28);
  });

  it('draws a focus ring as a hairline shadow in the accent', () => {
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
