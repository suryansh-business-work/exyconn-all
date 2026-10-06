import { z } from 'zod';
import {
  CSS_TOKEN_KEY,
  CSS_TOKEN_VALUE,
  FONT_FAMILY,
  FONT_VARIANT,
  FONT_WEIGHT,
} from '@exyconn/regex';
import type {
  CmsDesignSystemFieldsFragment,
  CmsDesignSystemInput,
} from '@exyconn/shell/graphql/generated';
import {
  readTokens,
  type DesignTokens,
  type TokenMap,
} from '../../../cms/design-system/design-tokens';
import { FONT_FORMATS } from '../../../cms/design-system/font-sources';

export type CmsDesignSystemRow = CmsDesignSystemFieldsFragment;

const tokenRow = z.object({
  key: z.string().trim().regex(CSS_TOKEN_KEY, 'Letters, digits and dashes, up to 61 characters'),
  value: z
    .string()
    .trim()
    .regex(CSS_TOKEN_VALUE, 'A CSS value without ; { } < >, up to 300 characters'),
});

/** A group of tokens; a name may appear once (it becomes one custom property). */
const tokenGroup = z.array(tokenRow).superRefine((rows, context) => {
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    if (seen.has(row.key)) {
      context.addIssue({
        code: 'custom',
        path: [index, 'key'],
        message: 'This name is used twice',
      });
    }
    seen.add(row.key);
  });
});

const fontFamily = z
  .string()
  .trim()
  .regex(FONT_FAMILY, "Letters, digits, spaces and . ' & - only, up to 80 characters");

const fontFile = z.object({
  url: z.string().startsWith('https://', 'The file needs an https address'),
  weight: z.string().regex(FONT_WEIGHT, 'A weight from 100 to 900'),
  style: z.enum(['normal', 'italic']),
  format: z.enum(FONT_FORMATS),
});

const fontSource = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('GOOGLE'),
    family: fontFamily,
    variants: z.array(z.string().regex(FONT_VARIANT)).min(1, 'Choose at least one style'),
  }),
  z.object({
    provider: z.literal('CUSTOM'),
    family: fontFamily,
    files: z.array(fontFile).min(1, 'Upload at least one file').max(40, 'At most 40 files'),
  }),
]);

/** The families the site loads (the server allows 30), each once. */
const fontSources = z
  .array(fontSource)
  .max(30, 'Load at most 30 font families')
  .refine(
    (sources) =>
      new Set(sources.map((source) => source.family.toLowerCase())).size === sources.length,
    'A family is loaded twice',
  );

export const designSystemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Keep the name under 100 characters'),
  palette: tokenGroup,
  colorsLight: tokenGroup,
  colorsDark: tokenGroup,
  fonts: tokenGroup,
  radii: tokenGroup,
  shadows: tokenGroup,
  spacing: tokenGroup,
  fontSources,
  extraCss: z.string().max(100_000, 'Too long'),
});

export type DesignSystemFormValues = z.infer<typeof designSystemSchema>;
export type TokenRow = DesignSystemFormValues['fonts'][number];
/** The token lists of the form, by field name. */
export type TokenGroupName = Exclude<
  keyof DesignSystemFormValues,
  'name' | 'extraCss' | 'fontSources'
>;

const rows = (map: TokenMap): TokenRow[] =>
  Object.entries(map).map(([key, value]) => ({ key, value }));
const map = (list: readonly TokenRow[]): TokenMap =>
  Object.fromEntries(list.map((row) => [row.key.trim(), row.value.trim()]));

export function toDesignValues(design: CmsDesignSystemRow): DesignSystemFormValues {
  const tokens = readTokens(design.tokens);
  return {
    name: design.name,
    palette: rows(tokens.palette),
    colorsLight: rows(tokens.colors.light),
    colorsDark: rows(tokens.colors.dark),
    fonts: rows(tokens.fonts),
    radii: rows(tokens.radii),
    shadows: rows(tokens.shadows),
    spacing: rows(tokens.spacing),
    fontSources: tokens.fontSources,
    extraCss: design.extraCss,
  };
}

/** The form's values as tokens, the shape the website reads. */
export function toDesignTokens(values: DesignSystemFormValues): DesignTokens {
  return {
    palette: map(values.palette),
    colors: { light: map(values.colorsLight), dark: map(values.colorsDark) },
    fonts: map(values.fonts),
    radii: map(values.radii),
    shadows: map(values.shadows),
    spacing: map(values.spacing),
    fontSources: values.fontSources,
  };
}

export const toDesignInput = (
  siteId: string,
  values: DesignSystemFormValues,
): CmsDesignSystemInput => ({
  siteId,
  name: values.name,
  tokens: toDesignTokens(values),
  extraCss: values.extraCss,
});
