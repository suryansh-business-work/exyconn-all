import { describe, expect, it } from 'vitest';
import {
  FONT_FORMATS,
  GENERIC_FAMILIES,
  fontFaceCss,
  fontStack,
  googleFontsUrl,
  googleSourcesUrl,
  parseFontStack,
  readFontSources,
  type FontSource,
} from '../../../../../src/pages/cms/design-system/font-sources';

const CSS2 = 'https://fonts.googleapis.com/css2';

describe('readFontSources', () => {
  it('reads nothing from a value that is not a list', () => {
    expect(readFontSources(undefined)).toEqual([]);
    expect(readFontSources({ family: 'Inter' })).toEqual([]);
  });

  it('keeps Google families with their string variants and drops malformed entries', () => {
    expect(
      readFontSources([
        null,
        { provider: 'GOOGLE' },
        { provider: 'GOOGLE', family: 'Inter', variants: ['400', 7, '700i'] },
        { provider: 'GOOGLE', family: 'Lora' },
        { provider: 'ADOBE', family: 'Proxima' },
      ]),
    ).toEqual([
      { provider: 'GOOGLE', family: 'Inter', variants: ['400', '700i'] },
      { provider: 'GOOGLE', family: 'Lora', variants: [] },
    ]);
  });

  it('keeps the well-formed files of an uploaded family', () => {
    expect(
      readFontSources([
        {
          provider: 'CUSTOM',
          family: 'Brand',
          files: [
            { url: 'https://cdn/a.woff', weight: '400', style: 'italic', format: 'woff' },
            { url: 'https://cdn/b.bin', weight: '700', format: 'exotic' },
            { url: 'https://cdn/c.woff2' },
            { url: 'https://cdn/d.otf', weight: '300' },
            'not a file',
          ],
        },
        { provider: 'CUSTOM', family: 'Empty', files: 'none' },
      ]),
    ).toEqual([
      {
        provider: 'CUSTOM',
        family: 'Brand',
        files: [
          { url: 'https://cdn/a.woff', weight: '400', style: 'italic', format: 'woff' },
          { url: 'https://cdn/b.bin', weight: '700', style: 'normal', format: 'woff2' },
          { url: 'https://cdn/d.otf', weight: '300', style: 'normal', format: 'woff2' },
        ],
      },
      { provider: 'CUSTOM', family: 'Empty', files: [] },
    ]);
  });
});

describe('googleFontsUrl', () => {
  it('is empty without families', () => {
    expect(googleFontsUrl([])).toBe('');
  });

  it('asks for every style sorted the way the API requires', () => {
    expect(googleFontsUrl([{ family: 'Inter Tight', variants: ['700i', '700', '400'] }])).toBe(
      `${CSS2}?family=Inter+Tight:ital,wght@0,400;0,700;1,700&display=swap`,
    );
  });

  it('asks for the regular weight of a family with no styles, and limits the text', () => {
    expect(
      googleFontsUrl(
        [
          { family: 'Lora', variants: [] },
          { family: 'Inter', variants: ['400i'] },
        ],
        'Ab c',
      ),
    ).toBe(
      `${CSS2}?family=Lora:ital,wght@0,400&family=Inter:ital,wght@1,400&display=swap&text=Ab%20c`,
    );
  });
});

describe('googleSourcesUrl and fontFaceCss', () => {
  const sources: FontSource[] = [
    { provider: 'GOOGLE', family: 'Inter', variants: ['400'] },
    {
      provider: 'CUSTOM',
      family: 'My "Brand"',
      files: [
        { url: 'https://cdn/r.woff2', weight: '400', style: 'normal', format: 'woff2' },
        { url: 'https://cdn/i.ttf', weight: '700', style: 'italic', format: 'truetype' },
      ],
    },
  ];

  it('loads only the Google families from Google', () => {
    expect(googleSourcesUrl(sources)).toBe(`${CSS2}?family=Inter:ital,wght@0,400&display=swap`);
    expect(googleSourcesUrl(sources.slice(1))).toBe('');
  });

  it('writes one @font-face per uploaded file, quotes stripped from the family', () => {
    expect(fontFaceCss(sources)).toBe(
      [
        '@font-face { font-family: "My Brand"; src: url("https://cdn/r.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }',
        '@font-face { font-family: "My Brand"; src: url("https://cdn/i.ttf") format("truetype"); font-weight: 700; font-style: italic; font-display: swap; }',
      ].join('\n'),
    );
    expect(fontFaceCss(sources.slice(0, 1))).toBe('');
  });
});

describe('font stacks', () => {
  it('lists the supported formats and generic families', () => {
    expect(FONT_FORMATS).toEqual(['woff2', 'woff', 'truetype', 'opentype']);
    expect(GENERIC_FAMILIES).toContain('sans-serif');
  });

  it('builds a stack from a family and its fallback', () => {
    expect(fontStack('Inter Tight', 'serif')).toBe('"Inter Tight", serif');
    expect(fontStack('', 'monospace')).toBe('monospace');
  });

  it('splits a stack back into its family and generic fallback', () => {
    expect(parseFontStack('"Inter Tight", sans-serif')).toEqual({
      family: 'Inter Tight',
      fallback: 'sans-serif',
    });
    expect(parseFontStack("'Lora', serif")).toEqual({ family: 'Lora', fallback: 'serif' });
    expect(parseFontStack('serif')).toEqual({ family: '', fallback: 'serif' });
    expect(parseFontStack('Roboto, Arial')).toEqual({ family: 'Roboto', fallback: 'sans-serif' });
    expect(parseFontStack('')).toEqual({ family: '', fallback: 'sans-serif' });
  });
});
