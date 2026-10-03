import { color } from '@exyconn/ui';

/**
 * How an exported document is printed — the same in the PDF and the Word file, so the two
 * downloads of one contract look like the same document.
 */

/** CSS pixels (what the editor stores) to typographic points (what both formats measure in). */
export const PX_TO_PT = 0.75;

/** A4 at 72 points per inch, with a 2 cm margin all round. */
export const PAGE = { width: 595.28, margin: 56 } as const;

/** The widest anything on the page can be, in points and in CSS pixels. */
export const CONTENT_WIDTH_PT = PAGE.width - PAGE.margin * 2;
export const CONTENT_WIDTH_PX = Math.floor(CONTENT_WIDTH_PT / PX_TO_PT);

/** Word measures the page in twentieths of a point. */
export const TWIPS_PER_PT = 20;
export const PAGE_MARGIN_TWIPS = PAGE.margin * TWIPS_PER_PT;
export const CONTENT_WIDTH_TWIPS = Math.floor(CONTENT_WIDTH_PT * TWIPS_PER_PT);

/** Body text, in points. */
export const BODY_SIZE = 10.5;

export const HEADING_SIZES: Readonly<Record<1 | 2 | 3 | 4, number>> = {
  1: 20,
  2: 16,
  3: 13.5,
  4: 12,
};

/** The ink of everything the document draws itself — rules, borders, fills, links. */
export const INK = {
  rule: color.mist[250],
  border: color.mist[400],
  headerFill: color.mist[200],
  codeFill: color.mist[100],
  quoteBar: color.mist[400],
  muted: color.mist[600],
  link: color.blue[700],
  heading: color.mist[850],
} as const;

/** The Word file's faces: one everybody has, and a monospace one for code. */
export const WORD_FONTS = { body: 'Calibri', mono: 'Consolas' } as const;
