/** A font file uploaded to the media library: one weight and style of a custom family. */
export interface FontFile {
  url: string;
  weight: string;
  style: 'normal' | 'italic';
  format: 'woff2' | 'woff' | 'truetype' | 'opentype';
}

/** A family a design system loads: from Google Fonts (with its styles) or uploaded. */
export type FontSource =
  | { provider: 'GOOGLE'; family: string; variants: string[] }
  | { provider: 'CUSTOM'; family: string; files: FontFile[] };

export const FONT_FORMATS = ['woff2', 'woff', 'truetype', 'opentype'] as const;
const FORMAT_SET = new Set<string>(FONT_FORMATS);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function readFile(value: unknown): FontFile | null {
  if (!isRecord(value) || typeof value.url !== 'string' || typeof value.weight !== 'string') {
    return null;
  }
  const format =
    typeof value.format === 'string' && FORMAT_SET.has(value.format) ? value.format : 'woff2';
  return {
    url: value.url,
    weight: value.weight,
    style: value.style === 'italic' ? 'italic' : 'normal',
    format: format as FontFile['format'],
  };
}

/** Reads `tokens.fontSources`, dropping anything malformed. */
export function readFontSources(value: unknown): FontSource[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): FontSource[] => {
    if (!isRecord(item) || typeof item.family !== 'string') return [];
    if (item.provider === 'GOOGLE') {
      return [{ provider: 'GOOGLE', family: item.family, variants: strings(item.variants) }];
    }
    if (item.provider === 'CUSTOM') {
      const files = (Array.isArray(item.files) ? item.files : []).map(readFile);
      return [
        { provider: 'CUSTOM', family: item.family, files: files.filter((file) => file !== null) },
      ];
    }
    return [];
  });
}

const GOOGLE_CSS2 = 'https://fonts.googleapis.com/css2';

/** `400`, `700i` → Google's `ital,wght` tuples, sorted as the API requires. */
function axisTuples(variants: readonly string[]): string {
  const tuples = variants.map((variant) => {
    const italic = variant.endsWith('i') ? 1 : 0;
    return [italic, Number.parseInt(variant, 10)] as const;
  });
  tuples.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return tuples.map(([italic, weight]) => `${italic},${weight}`).join(';');
}

/**
 * One css2 stylesheet URL for Google families (display=swap), or '' when there are none.
 * `text` limits the download to those characters — enough to draw a family's name in a list.
 */
export function googleFontsUrl(
  families: ReadonlyArray<{ family: string; variants: readonly string[] }>,
  text?: string,
): string {
  if (families.length === 0) return '';
  const params = families.map((font) => {
    const name = encodeURIComponent(font.family).replaceAll('%20', '+');
    const variants = font.variants.length > 0 ? font.variants : ['400'];
    return `family=${name}:ital,wght@${axisTuples(variants)}`;
  });
  const textParam = text ? `&text=${encodeURIComponent(text)}` : '';
  return `${GOOGLE_CSS2}?${params.join('&')}&display=swap${textParam}`;
}

/** The css2 URL of a design system's Google families. */
export const googleSourcesUrl = (sources: readonly FontSource[]): string =>
  googleFontsUrl(sources.flatMap((source) => (source.provider === 'GOOGLE' ? [source] : [])));

const quoted = (family: string) => `"${family.replaceAll('"', '')}"`;

/** @font-face rules for the uploaded families. */
export function fontFaceCss(sources: readonly FontSource[]): string {
  return sources
    .flatMap((source) =>
      source.provider === 'CUSTOM' ? source.files.map((file) => ({ source, file })) : [],
    )
    .map(({ source, file }) => {
      const src = `url("${file.url}") format("${file.format}")`;
      return `@font-face { font-family: ${quoted(source.family)}; src: ${src}; font-weight: ${file.weight}; font-style: ${file.style}; font-display: swap; }`;
    })
    .join('\n');
}

/** The generic families a stack falls back to. */
export const GENERIC_FAMILIES = [
  'sans-serif',
  'serif',
  'monospace',
  'system-ui',
  'cursive',
] as const;
const GENERIC_SET = new Set<string>(GENERIC_FAMILIES);

/** A CSS font stack from a family and a generic fallback: `"Inter Tight", sans-serif`. */
export const fontStack = (family: string, fallback: string): string =>
  family ? `${quoted(family)}, ${fallback}` : fallback;

/** Splits a stack back into its first family and its generic fallback. */
export function parseFontStack(stack: string): { family: string; fallback: string } {
  const parts = stack.split(',').map((part) => part.trim().replaceAll(/^["']|["']$/g, ''));
  const last = parts.at(-1) ?? '';
  const fallback = GENERIC_SET.has(last) ? last : 'sans-serif';
  const family = parts[0] && !GENERIC_SET.has(parts[0]) ? parts[0] : '';
  return { family, fallback };
}
