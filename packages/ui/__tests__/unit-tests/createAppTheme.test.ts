import { describe, expect, it } from 'vitest';
import { createAppTheme, theme } from '../../src/theme';
import { BASE_RADIUS, CARD_RADIUS } from '../../src/tokens/border.token';
import { selectedInk } from '../../src/tokens/selection.token';

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
    'inks the selected tab with the selection ink in %s',
    (mode) => {
      const tab = createAppTheme(mode).components?.MuiTab?.styleOverrides?.root as Record<
        string,
        unknown
      >;
      expect(tab['&.Mui-selected']).toEqual({
        backgroundColor: selectedInk[mode].fill,
        color: selectedInk[mode].ink,
      });
    },
  );

  it('exports the light theme as the default instance', () => {
    expect(theme.palette.mode).toBe('light');
  });
});
