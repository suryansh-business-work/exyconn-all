// Pure helpers that cluster pdf.js text items into spreadsheet rows and cells.

/** Accent colors shared by the tool's page components. */
export const TOOL_COLOR = '#22c55e';
export const TOOL_COLOR_DARK = '#16a34a';

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
}

const ROW_Y_TOLERANCE = 3;
const COLUMN_GAP = 8;
const WORD_SPACE_GAP = 1;

export const isTextItem = (item: unknown): item is PdfTextItem =>
  typeof item === 'object' && item !== null && typeof (item as { str?: unknown }).str === 'string';

export const toPositioned = (items: unknown[]): PositionedText[] =>
  items.filter(isTextItem).map((item) => ({
    str: item.str,
    x: item.transform[4],
    y: item.transform[5],
    width: item.width,
  }));

/** Clusters items into rows by y position (top to bottom), each row ordered left to right. */
export const clusterRows = (items: PositionedText[], yTolerance: number = ROW_Y_TOLERANCE): PositionedText[][] => {
  const byYDesc = [...items];
  byYDesc.sort((a, b) => b.y - a.y);
  const rows: PositionedText[][] = [];
  for (const item of byYDesc) {
    const row = rows.at(-1);
    if (row && Math.abs(row[0].y - item.y) <= yTolerance) {
      row.push(item);
    } else {
      rows.push([item]);
    }
  }
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
  }
  return rows;
};

/** Splits one row into cells: a horizontal gap wider than columnGap starts a new column. */
export const rowToCells = (row: PositionedText[], columnGap: number = COLUMN_GAP): string[] => {
  const cells: string[] = [];
  let prevEnd: number | null = null;
  for (const item of row) {
    if (prevEnd !== null && item.x - prevEnd <= columnGap && cells.length > 0) {
      const spacer = item.x - prevEnd > WORD_SPACE_GAP ? ' ' : '';
      cells[cells.length - 1] += `${spacer}${item.str}`;
    } else {
      cells.push(item.str);
    }
    prevEnd = item.x + item.width;
  }
  return cells.map((cell) => cell.replaceAll(/\s+/g, ' ').trim());
};

/** Full pipeline: raw pdf.js text items of one page -> rows of cell strings (empty rows dropped). */
export const extractRows = (items: unknown[]): string[][] =>
  clusterRows(toPositioned(items))
    .map((row) => rowToCells(row))
    .filter((cells) => cells.some((cell) => cell !== ''));

export interface PreviewCell {
  id: string;
  text: string;
}

export interface PreviewRow {
  id: string;
  cells: PreviewCell[];
}

/** Wraps the first `limit` rows with stable ids so the preview table has proper React keys. */
export const toPreviewRows = (rows: string[][], limit: number): PreviewRow[] =>
  rows.slice(0, limit).map((cells) => ({
    id: globalThis.crypto.randomUUID(),
    cells: cells.map((text) => ({ id: globalThis.crypto.randomUUID(), text })),
  }));

export const downloadBlob = (blob: Blob, fileName: string) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
};
