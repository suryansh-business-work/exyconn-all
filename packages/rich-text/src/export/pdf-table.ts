import type { Content, CustomTableLayout, TableCell as PdfCell } from 'pdfmake/interfaces';
import type { Block, TableCell } from './model';
import { INK } from './print';
import { headerRowCount, spanGrid } from './table-grid';

const HAIRLINE = 0.5;

export const GRID_LAYOUT: CustomTableLayout = {
  hLineWidth: () => HAIRLINE,
  vLineWidth: () => HAIRLINE,
  hLineColor: () => INK.border,
  vLineColor: () => INK.border,
};

/** The table, its cells rendered with `renderBlocks`. */
export function pdfTable(
  rows: readonly TableCell[][],
  renderBlocks: (blocks: readonly Block[]) => Content[],
): Content {
  const grid = spanGrid(rows);
  const body: PdfCell[][] = grid.map((row) =>
    row.map((slot): PdfCell => {
      if (!slot) {
        return {};
      }
      return {
        stack: renderBlocks(slot.blocks),
        colSpan: slot.colSpan,
        rowSpan: slot.rowSpan,
        bold: slot.header,
        fillColor: slot.header ? INK.headerFill : undefined,
      };
    }),
  );
  return {
    table: {
      headerRows: headerRowCount(rows),
      widths: (grid[0] ?? []).map(() => '*'),
      body,
    },
    layout: GRID_LAYOUT,
    margin: [0, 4, 0, 10],
  };
}
