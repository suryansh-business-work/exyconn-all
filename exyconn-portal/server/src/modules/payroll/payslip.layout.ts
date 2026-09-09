import { FONTS } from './payslip.brand';

/**
 * The payslip's grid and the handful of primitives every block is built from.
 *
 * The page is ISO 216 A4 in portrait. Everything below is expressed in PDF points from
 * that page's edges, so a block only ever needs to say where it starts — the geometry
 * of what sits beside it is settled here once rather than guessed at each call site.
 */

/** A4 at 72 dpi: 210 mm x 297 mm. */
export const PAGE = { width: 595.28, height: 841.89 } as const;

export const MARGIN = 46;
export const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
export const CONTENT_RIGHT = MARGIN + CONTENT_WIDTH;

/** Earnings and deductions sit side by side, with a gutter wide enough to read as one. */
export const COLUMN_GAP = 20;
export const COLUMN_WIDTH = (CONTENT_WIDTH - COLUMN_GAP) / 2;
export const RIGHT_COLUMN = MARGIN + COLUMN_WIDTH + COLUMN_GAP;

/** Vertical rhythm: every gap on the page is one of these, so nothing looks arbitrary. */
export const SPACE = { xs: 4, sm: 8, md: 14, lg: 22, xl: 32 } as const;

export const ROW_HEIGHT = 18;
export const SECTION_TITLE_HEIGHT = 22;

export const INK = '#0f172a';
export const MUTED = '#64748b';
export const RULE = '#e2e8f0';
export const PANEL = '#f8fafc';
export const ACCENT = '#155dfc';

export const TEXT = { title: 20, heading: 12, body: 9.5, small: 8, caption: 7.5 } as const;

/** A hairline across a given span — the only kind of rule the document draws. */
export function rule(
  doc: PDFKit.PDFDocument,
  left: number,
  top: number,
  width: number,
  color: string = RULE,
): void {
  doc
    .moveTo(left, top)
    .lineTo(left + width, top)
    .lineWidth(0.7)
    .strokeColor(color)
    .stroke();
}

/**
 * A section heading: small, spaced capitals over a rule. Returns the y the section's
 * first row starts at, so callers never have to know how tall a heading is.
 */
export function sectionTitle(
  doc: PDFKit.PDFDocument,
  left: number,
  top: number,
  width: number,
  title: string,
): number {
  doc
    .font(FONTS.bold)
    .fontSize(TEXT.small)
    .fillColor(ACCENT)
    .text(title.toUpperCase(), left, top, { width, characterSpacing: 0.8 });
  rule(doc, left, top + 13, width);
  return top + SECTION_TITLE_HEIGHT;
}

/**
 * How wide the value half of a row is. Rows are measured and drawn against the same
 * number, so a value that wraps is one the row already made room for.
 *
 * Weighted towards the value because the values are the long half: a work email or a
 * PF number has no spaces to wrap at, so a column too narrow for one breaks it mid-word.
 */
export function valueWidthOf(width: number): number {
  return width * 0.58;
}

/** The two halves of a row, given the space the row has to fill. */
function halves(width: number, valueWidth: number) {
  return { label: width - valueWidth - SPACE.sm, value: valueWidth };
}

/**
 * How tall a row needs to be. A long designation or a PF number is longer than the
 * column is wide, and a row that assumed one line would print it over its neighbour.
 */
export function rowHeight(
  doc: PDFKit.PDFDocument,
  width: number,
  label: string,
  value: string,
  valueWidth = valueWidthOf(width),
): number {
  const size = halves(width, valueWidth);
  const labelHeight = doc
    .font(FONTS.regular)
    .fontSize(TEXT.body)
    .heightOfString(label, { width: size.label });
  const valueHeight = doc
    .font(FONTS.bold)
    .fontSize(TEXT.body)
    .heightOfString(value, { width: size.value });
  return Math.max(ROW_HEIGHT, Math.max(labelHeight, valueHeight) + SPACE.xs);
}

/**
 * One `label   value` row inside a fixed-width column, the label greyed and the value
 * hard against the column's right edge. Both are drawn from the same `top` so a value
 * that wraps cannot drag its label out of line, and the row's height is returned so the
 * caller can put the next one directly below it.
 */
export function labelledRow(
  doc: PDFKit.PDFDocument,
  left: number,
  top: number,
  width: number,
  label: string,
  value: string,
  valueWidth = valueWidthOf(width),
): number {
  const size = halves(width, valueWidth);
  doc
    .font(FONTS.regular)
    .fontSize(TEXT.body)
    .fillColor(MUTED)
    .text(label, left, top, { width: size.label });
  doc
    .font(FONTS.bold)
    .fillColor(INK)
    .text(value, left + width - valueWidth, top, { width: size.value, align: 'right' });
  return rowHeight(doc, width, label, value, valueWidth);
}

/** A filled panel with a hairline border — the background of the header and net-pay blocks. */
export function panel(
  doc: PDFKit.PDFDocument,
  left: number,
  top: number,
  width: number,
  height: number,
  fill: string = PANEL,
): void {
  doc
    .roundedRect(left, top, width, height, 4)
    .fillAndStroke(fill, RULE)
    .lineWidth(0.7)
    .fillColor(INK);
}
