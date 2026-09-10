import { describe, expect, it } from 'vitest';
import { createAppTheme, theme } from '../../src/theme';

describe('createAppTheme', () => {
  it('builds a light and a dark palette', () => {
    expect(createAppTheme('light').palette.mode).toBe('light');
    expect(createAppTheme('dark').palette.mode).toBe('dark');
  });

  it('keeps the compact, flat portal defaults', () => {
    const light = createAppTheme('light');
    // One radius for every surface — `glass` follows this rather than carrying its own.
    expect(light.shape.borderRadius).toBe(8);
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

  it('exports the light theme as the default instance', () => {
    expect(theme.palette.mode).toBe('light');
  });
});
