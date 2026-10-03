import type { TableCell } from './model';

/** A slot in the table grid: the cell that starts there, or `null` where a span covers it. */
export type Slot = TableCell | null;

/** The first column at or after `from` that no earlier span has claimed. */
function nextFree(row: readonly (Slot | undefined)[], from: number): number {
  let column = from;
  while (row[column] !== undefined) {
    column += 1;
  }
  return column;
}

/** Puts a cell in the grid and marks every slot its row and column span covers. */
function place(grid: (Slot | undefined)[][], rowIndex: number, column: number, cell: TableCell) {
  for (let down = 0; down < cell.rowSpan; down += 1) {
    const row = grid[rowIndex + down];
    for (let across = 0; across < cell.colSpan && row; across += 1) {
      row[column + across] = down === 0 && across === 0 ? cell : null;
    }
  }
}

/**
 * The table as a full rectangle. pdfmake wants every row to have a slot for every column,
 * with an empty one wherever a merged cell reaches; HTML leaves those slots out.
 */
export function spanGrid(rows: readonly TableCell[][]): Slot[][] {
  const grid: (Slot | undefined)[][] = rows.map(() => []);
  rows.forEach((row, rowIndex) => {
    let column = 0;
    for (const cell of row) {
      column = nextFree(grid[rowIndex] ?? [], column);
      place(grid, rowIndex, column, cell);
      column += cell.colSpan;
    }
  });
  const width = Math.max(1, ...grid.map((row) => row.length));
  return grid.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? null));
}

/** How many rows at the top are header rows — repeated on every page the table runs onto. */
export function headerRowCount(rows: readonly TableCell[][]): number {
  const index = rows.findIndex((row) => !row.every((cell) => cell.header));
  return index === -1 ? rows.length : index;
}
