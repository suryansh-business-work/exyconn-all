import { describe, expect, it } from 'vitest';
import {
  designSystemSchema,
  toDesignInput,
  toDesignTokens,
  toDesignValues,
  type CmsDesignSystemRow,
  type DesignSystemFormValues,
} from '../../../../../../src/pages/website/forms/cms-design-system/cms-design-system.types';

const design: CmsDesignSystemRow = {
  id: 'ds-1',
  siteId: 'site-1',
  name: 'Brand',
  tokens: {
    palette: { 'brand-500': '#f9851f' },
    colors: { light: { primary: 'var(--palette-brand-500)' }, dark: { page: '#09090b' } },
    fonts: { sans: '"Inter", sans-serif' },
    radii: { md: '0.5rem' },
    shadows: { sm: '0 1px 2px rgb(0 0 0 / 5%)' },
    spacing: { '4': '1rem' },
    fontSources: [{ provider: 'GOOGLE', family: 'Inter', variants: ['400'] }],
  },
  extraCss: '.btn { color: red; }',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const values: DesignSystemFormValues = {
  name: 'Brand',
  palette: [{ key: 'brand-500', value: '#f9851f' }],
  colorsLight: [{ key: 'primary', value: 'var(--palette-brand-500)' }],
  colorsDark: [{ key: 'page', value: '#09090b' }],
  fonts: [{ key: 'sans', value: '"Inter", sans-serif' }],
  radii: [{ key: 'md', value: '0.5rem' }],
  shadows: [{ key: 'sm', value: '0 1px 2px rgb(0 0 0 / 5%)' }],
  spacing: [{ key: '4', value: '1rem' }],
  fontSources: [{ provider: 'GOOGLE', family: 'Inter', variants: ['400'] }],
  extraCss: '.btn { color: red; }',
};

const messages = (input: DesignSystemFormValues) => {
  const result = designSystemSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('toDesignValues', () => {
  it('turns each token group into editable rows', () => {
    expect(toDesignValues(design)).toEqual(values);
  });

  it('tolerates a design system saved with no tokens', () => {
    expect(toDesignValues({ ...design, tokens: null })).toEqual({
      name: 'Brand',
      palette: [],
      colorsLight: [],
      colorsDark: [],
      fonts: [],
      radii: [],
      shadows: [],
      spacing: [],
      fontSources: [],
      extraCss: '.btn { color: red; }',
    });
  });
});

describe('toDesignTokens', () => {
  it('writes the rows back as trimmed token maps', () => {
    const tokens = toDesignTokens({
      ...values,
      radii: [{ key: ' lg ', value: ' 1rem ' }],
    });
    expect(tokens).toEqual({ ...design.tokens, radii: { lg: '1rem' } });
  });
});

describe('toDesignInput', () => {
  it('files the tokens and extra CSS under the site', () => {
    expect(toDesignInput('site-1', values)).toEqual({
      siteId: 'site-1',
      name: 'Brand',
      tokens: design.tokens,
      extraCss: '.btn { color: red; }',
    });
  });
});

describe('designSystemSchema', () => {
  it('accepts a complete design system', () => {
    expect(messages(values)).toEqual([]);
  });

  it('flags a token name used twice in a group, on the second row', () => {
    const result = designSystemSchema.safeParse({
      ...values,
      radii: [
        { key: 'md', value: '0.5rem' },
        { key: 'md', value: '1rem' },
      ],
    });
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: ['radii', 1, 'key'], message: 'This name is used twice' }),
    ]);
  });

  it('rejects a token name with spaces and a value that could break out of CSS', () => {
    expect(messages({ ...values, spacing: [{ key: 'big gap', value: '1rem; }' }] })).toEqual([
      'Letters, digits and dashes, up to 61 characters',
      'A CSS value without ; { } < >, up to 300 characters',
    ]);
  });

  it('refuses a family loaded twice', () => {
    expect(
      messages({
        ...values,
        fontSources: [
          { provider: 'GOOGLE', family: 'Inter', variants: ['400'] },
          { provider: 'GOOGLE', family: 'inter', variants: ['700'] },
        ],
      }),
    ).toEqual(['A family is loaded twice']);
  });

  it('needs styles for a Google family and https files for an upload', () => {
    expect(
      messages({
        ...values,
        fontSources: [
          { provider: 'GOOGLE', family: 'Inter', variants: [] },
          {
            provider: 'CUSTOM',
            family: 'Brand Sans',
            files: [
              {
                url: 'http://cdn.example.com/a.woff2',
                weight: '450',
                style: 'normal',
                format: 'woff2',
              },
            ],
          },
          { provider: 'CUSTOM', family: 'Empty', files: [] },
        ],
      }),
    ).toEqual([
      'Choose at least one style',
      'The file needs an https address',
      'A weight from 100 to 900',
      'Upload at least one file',
    ]);
  });

  it('requires a name', () => {
    expect(messages({ ...values, name: '  ' })).toEqual(['Name is required']);
  });
});
