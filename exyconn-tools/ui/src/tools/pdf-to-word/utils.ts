// Pure helpers that turn pdf.js text items into paragraphs for the DOCX builder.

export interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

export interface PositionedText {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_LINE_HEIGHT = 12;
const LINE_Y_TOLERANCE = 2;
const PARAGRAPH_GAP_FACTOR = 1.5;
const WORD_SPACE_GAP = 1;

export const isTextItem = (item: unknown): item is PdfTextItem =>
  typeof item === 'object' && item !== null && typeof (item as { str?: unknown }).str === 'string';

export const toPositioned = (items: unknown[]): PositionedText[] =>
  items.filter(isTextItem).map((item) => ({
    str: item.str,
    x: item.transform[4],
    y: item.transform[5],
    width: item.width,
    height: item.height || DEFAULT_LINE_HEIGHT,
  }));

/** Groups items into visual lines: same baseline (within tolerance), left-to-right. */
export const groupIntoLines = (items: PositionedText[], yTolerance: number = LINE_Y_TOLERANCE): PositionedText[][] => {
  const byYDesc = [...items];
  byYDesc.sort((a, b) => b.y - a.y);
  const lines: PositionedText[][] = [];
  for (const item of byYDesc) {
    const line = lines.at(-1);
    if (line && Math.abs(line[0].y - item.y) <= yTolerance) {
      line.push(item);
    } else {
      lines.push([item]);
    }
  }
  for (const line of lines) {
    line.sort((a, b) => a.x - b.x);
  }
  return lines;
};

/** Joins the items of one line, inserting a space only where a horizontal gap exists. */
export const joinLineText = (line: PositionedText[]): string => {
  let text = '';
  let prevEnd: number | null = null;
  for (const item of line) {
    const needsSpace =
      prevEnd !== null && item.x - prevEnd > WORD_SPACE_GAP && !text.endsWith(' ') && !item.str.startsWith(' ');
    text += needsSpace ? ` ${item.str}` : item.str;
    prevEnd = item.x + item.width;
  }
  return text.replaceAll(/\s+/g, ' ').trim();
};

const lineHeightOf = (line: PositionedText[]): number =>
  line.reduce((max, item) => Math.max(max, item.height), 0) || DEFAULT_LINE_HEIGHT;

const isParagraphBreak = (prev: PositionedText[], next: PositionedText[], gapFactor: number): boolean =>
  prev[0].y - next[0].y > lineHeightOf(prev) * gapFactor;

/** Merges consecutive lines into paragraphs; a vertical gap larger than gapFactor line heights starts a new one. */
export const linesToParagraphs = (lines: PositionedText[][], gapFactor: number = PARAGRAPH_GAP_FACTOR): string[] => {
  const paragraphs: string[] = [];
  let current: string[] = [];
  let prev: PositionedText[] | null = null;
  for (const line of lines) {
    const text = joinLineText(line);
    if (!text) {
      continue;
    }
    if (prev && current.length > 0 && isParagraphBreak(prev, line, gapFactor)) {
      paragraphs.push(current.join(' '));
      current = [];
    }
    current.push(text);
    prev = line;
  }
  if (current.length > 0) {
    paragraphs.push(current.join(' '));
  }
  return paragraphs;
};

/** Full pipeline: raw pdf.js text items of one page -> paragraph strings. */
export const extractParagraphs = (items: unknown[]): string[] => linesToParagraphs(groupIntoLines(toPositioned(items)));
