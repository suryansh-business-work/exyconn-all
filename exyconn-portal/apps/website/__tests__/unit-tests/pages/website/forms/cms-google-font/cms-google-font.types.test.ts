import { describe, expect, it } from 'vitest';
import {
  GOOGLE_FONT_CATEGORIES,
  googleFontSchema,
  listVariant,
  variantLabel,
  type GoogleFontRow,
} from '../../../../../../src/pages/website/forms/cms-google-font/cms-google-font.types';

const font = (variants: string[]): GoogleFontRow => ({
  family: 'Inter',
  category: 'Sans Serif',
  variants,
  subsets: ['latin'],
  popularity: 1,
});

describe('variantLabel', () => {
  it.each([
    ['400', 'Regular 400'],
    ['700i', 'Bold 700 italic'],
    ['100', 'Thin 100'],
    ['900i', 'Black 900 italic'],
  ])('names %s as "%s"', (variant, label) => {
    expect(variantLabel(variant)).toBe(label);
  });

  it('falls back to the bare weight for one it has no name for', () => {
    expect(variantLabel('950')).toBe('950 950');
  });
});

describe('listVariant', () => {
  it('lists a family in its regular style when it has one', () => {
    expect(listVariant(font(['300', '400', '700']))).toBe('400');
  });

  it('uses the first style of a family without a regular', () => {
    expect(listVariant(font(['700', '900']))).toBe('700');
  });

  it('assumes regular for a family with no styles listed', () => {
    expect(listVariant(font([]))).toBe('400');
  });
});

describe('googleFontSchema', () => {
  it('accepts a family with styles to load', () => {
    expect(googleFontSchema.safeParse({ family: 'Inter Tight', variants: ['400'] }).success).toBe(
      true,
    );
  });

  it('needs a family picked and at least one style', () => {
    const result = googleFontSchema.safeParse({ family: '', variants: [] });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Pick a family from the list',
      'Choose at least one style to load',
    ]);
  });

  it('allows at most 18 styles', () => {
    const variants = Array.from({ length: 19 }, () => '400');
    const result = googleFontSchema.safeParse({ family: 'Inter', variants });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(['At most 18 styles']);
  });

  it('rejects a style that is not a Google variant', () => {
    expect(googleFontSchema.safeParse({ family: 'Inter', variants: ['bold'] }).success).toBe(false);
  });

  it('knows the catalogue categories', () => {
    expect(GOOGLE_FONT_CATEGORIES).toEqual([
      'Sans Serif',
      'Serif',
      'Display',
      'Handwriting',
      'Monospace',
    ]);
  });
});
