import { describe, expect, it, vi } from 'vitest';
import type { ColDef } from 'ag-grid-community';
import { cellValue, isDisplayColumn, type DisplayColDef } from '../../../src/grid/cellValue';

interface Row {
  name: string;
  owner: { profile: { email: string } | null };
}

const row: Row = { name: 'Acme', owner: { profile: { email: 'asha@example.test' } } };

describe('isDisplayColumn', () => {
  it('needs a heading and some way to a value', () => {
    expect(isDisplayColumn<Row>({ field: 'name', headerName: 'Name' })).toBe(true);
    expect(isDisplayColumn<Row>({ headerName: 'Kind', valueGetter: () => 'x' })).toBe(true);
    expect(isDisplayColumn<Row>({ headerName: 'Kind', valueFormatter: () => 'x' })).toBe(true);
    expect(isDisplayColumn<Row>({ field: 'name' })).toBe(false);
    expect(isDisplayColumn<Row>({ headerName: 'Empty' })).toBe(false);
  });

  it('never treats the actions column as data', () => {
    expect(isDisplayColumn<Row>({ colId: 'actions', headerName: 'Do', field: 'name' })).toBe(false);
  });
});

describe('cellValue', () => {
  it('reads a dotted field and stops at a null link in the chain', () => {
    const column: DisplayColDef<Row> = { field: 'owner.profile.email', headerName: 'Email' };
    expect(cellValue(column, row, {})).toBe('asha@example.test');
    expect(cellValue(column, { ...row, owner: { profile: null } }, {})).toBeUndefined();
  });

  it('prefers the getter over the field and hands it the row and context', () => {
    const valueGetter = vi.fn(() => 'derived');
    const context = { t: (source: string) => source };
    const column: DisplayColDef<Row> = { field: 'name', headerName: 'Name', valueGetter };
    expect(cellValue(column, row, context)).toBe('derived');
    expect(valueGetter).toHaveBeenCalledWith({ data: row, context });
  });

  it('runs the formatter over the raw value', () => {
    const column: DisplayColDef<Row> = {
      field: 'name',
      headerName: 'Name',
      valueFormatter: (params) => `${String(params.value)}!`,
    };
    expect(cellValue(column, row, {})).toBe('Acme!');
  });

  it('formats a column that has neither a field nor a getter from the row alone', () => {
    const column: ColDef<Row> & { headerName: string } = {
      headerName: 'Shout',
      // With nothing to read, the formatter is handed no value and works from the row.
      valueFormatter: (params) => `${String(params.value)}:${params.data?.name ?? ''}`,
    };
    expect(cellValue(column, row, {})).toBe('undefined:Acme');
  });

  it('ignores a getter given as an expression string, which only ag-grid evaluates', () => {
    const column: DisplayColDef<Row> = { field: 'name', headerName: 'Name', valueGetter: 'x' };
    expect(cellValue(column, row, {})).toBe('Acme');
  });
});
