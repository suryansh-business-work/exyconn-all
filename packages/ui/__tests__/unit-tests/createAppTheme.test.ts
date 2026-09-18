import { describe, expect, it } from 'vitest';
import { createAppTheme, theme } from '../../src/theme';
import { BASE_RADIUS, CARD_RADIUS } from '../../src/tokens/border.token';
import { selectedTab } from '../../src/theme/components/navigation';
import { portalShadow } from '../../src/tokens/box-shadow.token';
import { tokensFor } from '../../src/tokens/modes';

describe('createAppTheme', () => {
  it('builds a light and a dark palette', () => {
    expect(createAppTheme('light').palette.mode).toBe('light');
    expect(createAppTheme('dark').palette.mode).toBe('dark');
  });

  it('keeps the compact, flat portal defaults', () => {
    const light = createAppTheme('light');
    // Controls take the theme radius; card-like surfaces take the card corner.
    expect(light.shape.borderRadius).toBe(BASE_RADIUS);
    expect(light.components?.MuiCard?.styleOverrides?.root).toMatchObject({
      borderRadius: `${CARD_RADIUS}px`,
    });
    expect(light.components?.MuiButton?.defaultProps?.size).toBe('small');
    expect(light.components?.MuiTextField?.defaultProps?.size).toBe('small');
  });

  /**
   * A bare `<button>` takes its colour from the UA (`buttontext`, near-black), NOT from the
   * surface it sits on — which made every `Box component="button"` unreadable in dark mode.
   * The reset lives in the theme so it lands once, everywhere.
   */
  it.each(['light', 'dark'] as const)('lets a bare button inherit its ink in %s', (mode) => {
    const overrides = createAppTheme(mode).components?.MuiCssBaseline?.styleOverrides as Record<
      string,
      Record<string, string>
    >;
    expect(overrides.button).toMatchObject({ color: 'inherit', font: 'inherit' });
  });

  it.each(['light', 'dark'] as const)(
    'raises the selected tab out of its muted track in %s, as shadcn does',
    (mode) => {
      const t = tokensFor(mode);
      const theme = createAppTheme(mode);
      const tab = theme.components?.MuiTab?.styleOverrides?.root as Record<string, unknown>;
      expect(tab['&.Mui-selected']).toEqual(selectedTab({ mode, t }));
      expect(tab['&.Mui-selected']).toMatchObject({ backgroundColor: t.background.page });
    },
  );

  it.each(['light', 'dark'] as const)('puts the shadcn shadow scale on %s elevation', (mode) => {
    const { shadows } = createAppTheme(mode);
    const scale = portalShadow[mode];
    expect(shadows).toHaveLength(25);
    expect(shadows[0]).toBe('none');
    expect(shadows[1]).toBe(scale.xs);
    // MUI's menus sit at 8 and its dialogs at 24.
    expect(shadows[8]).toBe(scale.lg);
    expect(shadows[24]).toBe(scale.xl);
  });

  it.each(['light', 'dark'] as const)('rings keyboard focus in the ring colour in %s', (mode) => {
    const theme = createAppTheme(mode);
    expect(theme.focusVisible).toMatchObject({ outlineColor: tokensFor(mode).ring });
  });

  it('stands its own transitions still when the system asks for less motion', () => {
    const theme = createAppTheme('light');
    expect(theme.motion.reducedMotion).toBe('system');
    const baseline = theme.components?.MuiCssBaseline?.styleOverrides as Record<string, unknown>;
    expect(baseline).toHaveProperty(['@media (prefers-reduced-motion: reduce)']);
  });

  it.each(['light', 'dark'] as const)('exposes the muted and sidebar grounds in %s', (mode) => {
    const { palette } = createAppTheme(mode);
    const t = tokensFor(mode);
    expect(palette.background.muted).toBe(t.background.muted);
    expect(palette.background.sidebar).toBe(t.background.sidebar);
    expect(palette.action.hover).toBe(t.background.muted);
  });

  it('exports the light theme as the default instance', () => {
    expect(theme.palette.mode).toBe('light');
  });
});
