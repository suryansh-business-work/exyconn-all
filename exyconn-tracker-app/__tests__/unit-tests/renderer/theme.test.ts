import { describe, expect, it } from 'vitest';
import { boxShadow, color, trackerSelected, type Theme } from '@exyconn/ui';
import type { Branding } from '@shared/types';
import { brandColors, buildTheme, selectedFill, surface } from '../../../src/renderer/theme';

const brand = (colors: Partial<Branding>): Branding => ({ ...colors }) as Branding;

describe('brandColors', () => {
  it('uses the Exyconn defaults until the portal branding arrives', () => {
    expect(brandColors(null)).toEqual({
      primary: color.indigo[500],
      secondary: color.teal[400],
      background: color.slate[950],
      text: color.neutral[50],
    });
  });

  it('accepts short and long hex, with or without the hash, and trims stray spaces', () => {
    const colors = brandColors(
      brand({
        primaryColor: '#AbC',
        secondaryColor: '12ab9f',
        backgroundColor: ' #ffffff ',
        textColor: 'f0a',
      }),
    );

    expect(colors).toEqual({
      primary: '#AAbbCC',
      secondary: '#12ab9f',
      background: '#ffffff',
      text: '#ff00aa',
    });
  });

  it('falls back colour by colour when the portal sends something that is not a hex', () => {
    const colors = brandColors(
      brand({
        primaryColor: 'red',
        secondaryColor: '#12345',
        backgroundColor: '',
        textColor: '#000',
      }),
    );

    expect(colors.primary).toBe(color.indigo[500]);
    expect(colors.secondary).toBe(color.teal[400]);
    expect(colors.background).toBe(color.slate[950]);
    expect(colors.text).toBe('#000000');
  });
});

describe('the theme’s surfaces', () => {
  it.each(['light', 'dark'] as const)('wears the %s ink-on-paper fill when selected', (mode) => {
    const theme = buildTheme(null, mode);

    expect(selectedFill(theme)).toEqual({
      backgroundColor: trackerSelected[mode].fill,
      color: trackerSelected[mode].ink,
    });
  });

  it('lifts a panel with a shadow on the light ground and none on the dark', () => {
    const light = surface(buildTheme(null, 'light'));
    const dark = surface(buildTheme(null, 'dark'));

    expect(light.boxShadow).toBe(boxShadow.light.sm);
    expect(dark.boxShadow).toBe(boxShadow.dark.none);
    // A string, so `sx` does not read it as a multiple of the theme's radius.
    expect(typeof light.borderRadius).toBe('string');
    expect(light.backgroundColor).toBe(buildTheme(null, 'light').palette.background.paper);
  });

  it('styles a selected tab with the selected fill of the theme it is drawn in', () => {
    const theme = buildTheme(null, 'dark');
    const root = theme.components?.MuiTab?.styleOverrides?.root as (props: {
      theme: Theme;
    }) => Record<string, unknown>;

    const styles = root({ theme });

    expect(styles['&.Mui-selected']).toEqual(selectedFill(theme));
    expect(styles.textTransform).toBe('none');
  });
});
