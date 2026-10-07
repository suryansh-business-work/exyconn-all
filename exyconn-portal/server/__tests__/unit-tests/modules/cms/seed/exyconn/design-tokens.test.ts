import {
  EXYCONN_EXTRA_CSS,
  EXYCONN_TOKENS,
} from '../../../../../../src/modules/cms/seed/exyconn/design-tokens';
import { EXYCONN_PALETTE } from '../../../../../../src/modules/cms/seed/exyconn/palette';

const PALETTE_REF = /var\(--palette-([\w-]+)\)/g;
const COLOUR = /^(#[\da-f]{6}|oklch\([^)]+\))$/;

const referencedRamps = (text: string) => [...text.matchAll(PALETTE_REF)].map((match) => match[1]);

describe('EXYCONN_PALETTE', () => {
  it('holds the brand ramp and the base colours', () => {
    expect(EXYCONN_PALETTE['base-white']).toBe('#ffffff');
    expect(EXYCONN_PALETTE['base-black']).toBe('#000000');
    expect(EXYCONN_PALETTE['brand-500']).toBe('#0071e3');
  });

  it('defines every ramp step as a hex or oklch colour', () => {
    const invalid = Object.entries(EXYCONN_PALETTE).filter(([, value]) => !COLOUR.test(value));

    expect(Object.keys(EXYCONN_PALETTE).length).toBeGreaterThan(200);
    expect(invalid).toEqual([]);
  });
});

describe('EXYCONN_TOKENS', () => {
  it('groups the tokens the way the design system editor reads them', () => {
    expect(Object.keys(EXYCONN_TOKENS)).toEqual([
      'palette',
      'colors',
      'fonts',
      'radii',
      'shadows',
      'spacing',
    ]);
    expect(EXYCONN_TOKENS.palette).toBe(EXYCONN_PALETTE);
  });

  it('points every colour role at a ramp the palette defines', () => {
    const refs = referencedRamps(JSON.stringify(EXYCONN_TOKENS));
    const missing = refs.filter((ramp) => !(ramp in EXYCONN_PALETTE));

    expect(refs.length).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });

  it('uses the brand ramp for the primary role, lighter by night', () => {
    expect(EXYCONN_TOKENS.colors.light).toMatchObject({
      primary: 'var(--palette-brand-500)',
      'primary-hover': 'var(--palette-brand-600)',
    });
    expect(EXYCONN_TOKENS.colors.dark.primary).toBe('var(--palette-brand-300)');
  });

  it('only overrides by night roles the day theme defines', () => {
    const day = new Set(Object.keys(EXYCONN_TOKENS.colors.light));
    const night = Object.keys(EXYCONN_TOKENS.colors.dark);

    expect(night.length).toBeGreaterThan(0);
    expect(night.filter((role) => !day.has(role))).toEqual([]);
  });

  it('keeps the spacing scale in rem, growing step by step', () => {
    const values = Object.values(EXYCONN_TOKENS.spacing).map((value) =>
      Number.parseFloat(value.replace('rem', '')),
    );

    expect(Object.values(EXYCONN_TOKENS.spacing).every((value) => value.endsWith('rem'))).toBe(
      true,
    );
    expect(values.every((value, index) => index === 0 || value > values[index - 1])).toBe(true);
  });
});

describe('EXYCONN_EXTRA_CSS', () => {
  it('repeats the high-contrast answers outside dark mode, on defined ramps', () => {
    expect(EXYCONN_EXTRA_CSS.startsWith('@media (prefers-contrast: high)')).toBe(true);
    expect(EXYCONN_EXTRA_CSS).toContain(':root:not([data-theme="dark"])');
    expect(referencedRamps(EXYCONN_EXTRA_CSS).every((ramp) => ramp in EXYCONN_PALETTE)).toBe(true);
  });
});
