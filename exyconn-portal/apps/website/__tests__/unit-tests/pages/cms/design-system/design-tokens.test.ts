import { describe, expect, it } from 'vitest';
import {
  FLAT_GROUPS,
  lightTokensCss,
  readTokens,
} from '../../../../../src/pages/cms/design-system/design-tokens';

const EMPTY = {
  palette: {},
  colors: { light: {}, dark: {} },
  fonts: {},
  radii: {},
  shadows: {},
  spacing: {},
  fontSources: [],
};

describe('readTokens', () => {
  it('tolerates a missing or malformed tokens document', () => {
    expect(readTokens(null)).toEqual(EMPTY);
    expect(readTokens(['palette'])).toEqual(EMPTY);
    expect(readTokens({ colors: 'dark', palette: [] })).toEqual(EMPTY);
  });

  it('keeps the string tokens of every group and the font sources', () => {
    expect(
      readTokens({
        palette: { 'gray-900': '#111', count: 5 },
        colors: { light: { fg: '#000' }, dark: { fg: '#fff' } },
        fonts: { sans: '"Inter", sans-serif' },
        radii: { md: '4px' },
        shadows: { sm: '0 1px 2px #0003' },
        spacing: { '4': '1rem' },
        fontSources: [{ provider: 'GOOGLE', family: 'Inter', variants: ['400'] }],
      }),
    ).toEqual({
      palette: { 'gray-900': '#111' },
      colors: { light: { fg: '#000' }, dark: { fg: '#fff' } },
      fonts: { sans: '"Inter", sans-serif' },
      radii: { md: '4px' },
      shadows: { sm: '0 1px 2px #0003' },
      spacing: { '4': '1rem' },
      fontSources: [{ provider: 'GOOGLE', family: 'Inter', variants: ['400'] }],
    });
  });
});

describe('lightTokensCss', () => {
  it('names each group with the prefix the website writes', () => {
    expect(FLAT_GROUPS).toEqual({
      palette: 'palette',
      fonts: 'font-family',
      radii: 'radius',
      shadows: 'shadow',
      spacing: 'space',
    });
  });

  it('writes the daylight colours, then every scale, on :root', () => {
    const tokens = readTokens({
      palette: { 'brand-500': '#36c' },
      colors: { light: { fg: '#000', page: '#fff' }, dark: { fg: '#fff' } },
      fonts: { sans: 'Inter' },
      radii: { md: '4px' },
      shadows: { sm: '0 1px #0003' },
      spacing: { '2': '8px' },
    });

    expect(lightTokensCss(tokens)).toBe(
      [
        ':root {',
        '  --color-fg: #000;',
        '  --color-page: #fff;',
        '  --palette-brand-500: #36c;',
        '  --font-family-sans: Inter;',
        '  --radius-md: 4px;',
        '  --shadow-sm: 0 1px #0003;',
        '  --space-2: 8px;',
        '}',
      ].join('\n'),
    );
  });

  it('leaves out a token whose name or value could break out of its declaration', () => {
    const tokens = readTokens({
      colors: { light: { 'bad name': 'red', fg: 'red;} body{color:blue', ok: 'teal' } },
    });

    expect(lightTokensCss(tokens)).toBe(':root {\n  --color-ok: teal;\n}');
  });

  it('writes an empty rule for a design system with no tokens', () => {
    expect(lightTokensCss(readTokens({}))).toBe(':root {\n  \n}');
  });
});
