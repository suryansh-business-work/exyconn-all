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

  it('exports the light theme as the default instance', () => {
    expect(theme.palette.mode).toBe('light');
  });
});
