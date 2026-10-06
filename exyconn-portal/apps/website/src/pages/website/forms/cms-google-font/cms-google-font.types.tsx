import { z } from 'zod';
import { FONT_FAMILY, FONT_VARIANT } from '@exyconn/regex';
import type { CmsGoogleFontsQuery } from '@exyconn/shell/graphql/generated';

export type GoogleFontRow = CmsGoogleFontsQuery['cmsGoogleFonts']['rows'][number];

/** The catalogue's categories, as the server names them. */
export const GOOGLE_FONT_CATEGORIES = [
  'Sans Serif',
  'Serif',
  'Display',
  'Handwriting',
  'Monospace',
] as const;

export const googleFontSchema = z.object({
  family: z.string().regex(FONT_FAMILY, 'Pick a family from the list'),
  variants: z
    .array(z.string().regex(FONT_VARIANT))
    .min(1, 'Choose at least one style to load')
    .max(18, 'At most 18 styles'),
});

export type GoogleFontFormValues = z.infer<typeof googleFontSchema>;

/** `700i` → "Bold 700 italic", for the style checkboxes. */
const WEIGHT_NAMES: Record<string, string> = {
  '100': 'Thin',
  '200': 'Extra light',
  '300': 'Light',
  '400': 'Regular',
  '500': 'Medium',
  '600': 'Semibold',
  '700': 'Bold',
  '800': 'Extra bold',
  '900': 'Black',
};

export function variantLabel(variant: string): string {
  const weight = variant.replace('i', '');
  const name = WEIGHT_NAMES[weight] ?? weight;
  return variant.endsWith('i') ? `${name} ${weight} italic` : `${name} ${weight}`;
}

/** The style a family is listed in: regular when it has it, else its first. */
export const listVariant = (row: GoogleFontRow): string =>
  row.variants.includes('400') ? '400' : (row.variants[0] ?? '400');
