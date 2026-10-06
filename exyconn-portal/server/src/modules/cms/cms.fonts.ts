import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * The Google Fonts catalogue, as fonts.google.com itself reads it (no API key): every family
 * with its category, styles, subsets, variable axes and popularity. Read at most once a day.
 */
const CATALOGUE_URL = 'https://fonts.google.com/metadata/fonts';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 20_000;
const MAX_RESULTS = 200;

export interface GoogleFont {
  family: string;
  category: string;
  /** '400', '700i' … — weight, 'i' for italic. */
  variants: string[];
  subsets: string[];
  /** Variable axes, e.g. wght 100–900. */
  axes: Array<{ tag: string; min: number; max: number }>;
  /** Rank by use on the web; 1 is the most used. */
  popularity: number;
}

interface RawFamily {
  family: string;
  category: string;
  fonts?: Record<string, unknown>;
  subsets?: string[];
  axes?: Array<{ tag: string; min: number; max: number }>;
  popularity?: number;
}

let cache: { at: number; fonts: GoogleFont[] } | null = null;

const VARIANT_ORDER = (a: string, b: string) =>
  Number.parseInt(a, 10) - Number.parseInt(b, 10) || a.length - b.length;

function toFont(raw: RawFamily): GoogleFont {
  return {
    family: raw.family,
    category: raw.category,
    variants: Object.keys(raw.fonts ?? {}).sort(VARIANT_ORDER),
    subsets: (raw.subsets ?? []).filter((subset) => subset !== 'menu'),
    axes: (raw.axes ?? []).map(({ tag, min, max }) => ({ tag, min, max })),
    popularity: raw.popularity ?? Number.MAX_SAFE_INTEGER,
  };
}

async function catalogue(): Promise<GoogleFont[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.fonts;
  }
  let text: string;
  try {
    const response = await fetch(CATALOGUE_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    text = await response.text();
  } catch (error) {
    logger.error({ err: error }, 'Google Fonts catalogue could not be read');
    badRequest('Google Fonts could not be reached just now. Try again in a minute.');
  }
  // The feed has carried an anti-JSON-hijacking prefix (")]}'") at times; read from the first brace.
  const body = JSON.parse(text.slice(text.indexOf('{'))) as { familyMetadataList?: RawFamily[] };
  const fonts = (body.familyMetadataList ?? [])
    .map(toFont)
    .sort((a, b) => a.popularity - b.popularity);
  cache = { at: Date.now(), fonts };
  return fonts;
}

export const FONT_CATEGORIES = [
  'Sans Serif',
  'Serif',
  'Display',
  'Handwriting',
  'Monospace',
] as const;

/** Google Fonts families matching a search and category, most used first. */
export async function googleFonts(search?: string | null, category?: string | null, limit = 60) {
  const text = (search ?? '').trim().toLowerCase();
  const fonts = await catalogue();
  const matches = fonts.filter(
    (font) =>
      (!category || font.category === category) &&
      (text === '' || font.family.toLowerCase().includes(text)),
  );
  return {
    totalCount: matches.length,
    rows: matches.slice(0, Math.min(Math.max(limit, 1), MAX_RESULTS)),
  };
}
