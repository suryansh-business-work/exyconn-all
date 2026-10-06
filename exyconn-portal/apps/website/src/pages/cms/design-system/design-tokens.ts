import { CSS_TOKEN_KEY, CSS_TOKEN_VALUE } from '@exyconn/regex';
import { readFontSources, type FontSource } from './font-sources';

/** A token group as stored: name → CSS value. */
export type TokenMap = Record<string, string>;

/** A design system's tokens, as the server stores them (every group optional). */
export interface DesignTokens {
  /** The raw colour ramps (gray-900, brand-500…) the colour roles may point at. */
  palette: TokenMap;
  colors: { light: TokenMap; dark: TokenMap };
  fonts: TokenMap;
  radii: TokenMap;
  shadows: TokenMap;
  spacing: TokenMap;
  /** The families to load: Google Fonts styles or uploaded files. */
  fontSources: FontSource[];
}

/** The flat groups and the custom-property prefix the website writes each one under. */
export const FLAT_GROUPS = {
  palette: 'palette',
  fonts: 'font-family',
  radii: 'radius',
  shadows: 'shadow',
  spacing: 'space',
} as const;

export type FlatGroup = keyof typeof FLAT_GROUPS;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const tokenMap = (value: unknown): TokenMap => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
};

/** Reads the tokens JSON the server returns, tolerating missing groups. */
export function readTokens(json: unknown): DesignTokens {
  const tokens = isRecord(json) ? json : {};
  const colors = isRecord(tokens.colors) ? tokens.colors : {};
  return {
    palette: tokenMap(tokens.palette),
    colors: { light: tokenMap(colors.light), dark: tokenMap(colors.dark) },
    fonts: tokenMap(tokens.fonts),
    radii: tokenMap(tokens.radii),
    shadows: tokenMap(tokens.shadows),
    spacing: tokenMap(tokens.spacing),
    fontSources: readFontSources(tokens.fontSources),
  };
}

const declarations = (prefix: string, map: TokenMap): string[] =>
  Object.entries(map)
    .filter(([key, value]) => CSS_TOKEN_KEY.test(key) && CSS_TOKEN_VALUE.test(value))
    .map(([key, value]) => `--${prefix}-${key}: ${value};`);

/**
 * The design system as the website writes it: daylight colours and every scale on `:root`,
 * under the same custom-property names (--color-<role>, --font-family-<k>, --radius-<k>,
 * --shadow-<k>, --space-<k>), so a canvas or a preview styled with them looks like the site.
 */
export function lightTokensCss(tokens: DesignTokens): string {
  const lines = [
    ...declarations('color', tokens.colors.light),
    ...(Object.keys(FLAT_GROUPS) as FlatGroup[]).flatMap((group) =>
      declarations(FLAT_GROUPS[group], tokens[group]),
    ),
  ];
  return `:root {\n  ${lines.join('\n  ')}\n}`;
}
