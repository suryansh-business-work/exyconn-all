import { describe, expect, it } from 'vitest';
import type { TableCell } from '../../../src/export/model';
import { headerRowCount, spanGrid } from '../../../src/export/table-grid';

const label = new Map<TableCell, string>();

const cell = (name: string, extra: Partial<TableCell> = {}): TableCell => {
  const made: TableCell = { header: false, colSpan: 1, rowSpan: 1, blocks: [], ...extra };
  label.set(made, name);
  return made;
};

/** The grid as cell names, `null` where a span covers the slot. */
const names = (grid: ReturnType<typeof spanGrid>) =>
  grid.map((row) => row.map((slot) => (slot ? label.get(slot) : null)));

describe('spanGrid', () => {
  it('returns a plain table unchanged', () => {
    const rows = [
      [cell('a'), cell('b')],
      [cell('c'), cell('d')],
    ];
    expect(names(spanGrid(rows))).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('leaves an empty slot wherever a column or row span reaches', () => {
    const rows = [
      [cell('a', { colSpan: 2 }), cell('b', { rowSpan: 2 })],
      [cell('c'), cell('d')],
    ];
    expect(names(spanGrid(rows))).toEqual([
      ['a', null, 'b'],
      ['c', 'd', null],
    ]);
  });

  it('stops a row span at the last row and pads short rows', () => {
    const rows = [[cell('a', { rowSpan: 3 }), cell('b'), cell('c')], [cell('d')]];
    expect(names(spanGrid(rows))).toEqual([
      ['a', 'b', 'c'],
      [null, 'd', null],
    ]);
  });

  it('keeps at least one column for an empty table', () => {
    expect(spanGrid([])).toEqual([]);
    expect(spanGrid([[]])).toEqual([[null]]);
  });
});

describe('headerRowCount', () => {
  it('counts the leading rows made only of header cells', () => {
    const head = cell('h', { header: true });
    expect(headerRowCount([[head], [head], [cell('a')], [head]])).toBe(2);
    expect(headerRowCount([[cell('a')]])).toBe(0);
  });

  it('counts every row when the whole table is headers', () => {
    const head = cell('h', { header: true });
    expect(headerRowCount([[head], [head]])).toBe(2);
    expect(headerRowCount([])).toBe(0);
  });
});
