import { z } from 'zod';
import { FONT_FAMILY, FONT_WEIGHT } from '@exyconn/regex';
import { FONT_FORMATS } from '../../../cms/design-system/font-sources';
import { MAX_FONT_BYTES } from '../../../cms/media';

const fontFile = z.object({
  file: z
    .custom<File>((value) => value instanceof File, 'Pick a file')
    .refine((file) => file.size <= MAX_FONT_BYTES, 'Each file must be 5 MB or smaller'),
  weight: z.string().regex(FONT_WEIGHT, 'A weight from 100 to 900'),
  style: z.enum(['normal', 'italic']),
  format: z.enum(FONT_FORMATS),
});

export const customFontSchema = z.object({
  family: z
    .string()
    .trim()
    .min(1, 'Name the family')
    .regex(FONT_FAMILY, "Letters, digits, spaces and . ' & - only, up to 80 characters"),
  files: z.array(fontFile).min(1, 'Add at least one font file').max(40, 'At most 40 files'),
});

export type CustomFontFormValues = z.infer<typeof customFontSchema>;
export type CustomFontFileValues = CustomFontFormValues['files'][number];

export const FONT_WEIGHTS = [
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
] as const;

/** Weight names as font files are usually called (`Inter-SemiBold.woff2`). */
const WEIGHT_HINTS: ReadonlyArray<[RegExp, string]> = [
  [/thin|hairline/i, '100'],
  [/extra-?light|ultra-?light/i, '200'],
  [/light/i, '300'],
  [/medium/i, '500'],
  [/semi-?bold|demi-?bold/i, '600'],
  [/extra-?bold|ultra-?bold/i, '800'],
  [/black|heavy/i, '900'],
  [/bold/i, '700'],
];

/** A first guess at a file's weight and style from its name; the editor can correct both. */
export function guessFromName(name: string): Pick<CustomFontFileValues, 'weight' | 'style'> {
  const hint = WEIGHT_HINTS.find(([pattern]) => pattern.test(name));
  return { weight: hint?.[1] ?? '400', style: /italic|oblique/i.test(name) ? 'italic' : 'normal' };
}
