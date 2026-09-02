import { describe, expect, it, vi } from 'vitest';
import type { ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  boolColumn,
  dateColumn,
  derivedColumn,
  derivedStatusColumn,
  statusColumn,
  textColumn,
  valueColumn,
} from '../../src/grid/columns';

interface Row {
  name: string;
  amount: number;
  isActive: boolean;
  dueDate: string | null;
}

const row: Row = { name: 'Acme', amount: 1500, isActive: true, dueDate: '2026-03-01' };

/** ag-grid hands formatters the row plus the page's grid context. */
const formatterParams = (data: Row | undefined, context: unknown = {}) =>
  ({ data, value: data?.dueDate, context }) as unknown as ValueFormatterParams<Row>;

const getterParams = (data: Row | undefined) =>
  ({ data }) as unknown as ValueGetterParams<Row>;

const format = (column: { valueFormatter?: unknown }, data: Row | undefined, context?: unknown) =>
  (column.valueFormatter as (p: ValueFormatterParams<Row>) => string)(
    formatterParams(data, context),
  );

describe('column factories', () => {
  it('leaves text columns filterable so the server can search them', () => {
    expect(textColumn<Row>('name', 'Name')).toEqual({
      field: 'name',
      headerName: 'Name',
      valueFormatter: undefined,
    });
  });

  it('formats a text column through the row formatter when one is given', () => {
    const column = textColumn<Row>('name', 'Name', (r) => r.name.toUpperCase());
    expect(format(column, row)).toBe('ACME');
    expect(format(column, undefined)).toBe('');
  });

  it('turns off filtering on value columns the server cannot filter', () => {
    const column = valueColumn<Row>('amount', 'Amount', (r) => r.amount.toLocaleString());
    expect(column.filter).toBe(false);
    expect(column.floatingFilter).toBe(false);
    expect(column.sortable).toBeUndefined();
  });

  it('makes derived columns neither sortable nor filterable', () => {
    const column = derivedColumn<Row>('who', 'Who', (r) => r.name);
    expect(column).toMatchObject({ colId: 'who', sortable: false, filter: false });
    expect(format(column, row)).toBe('Acme');
  });

  it('reads a status chip straight off the field unless a mapper is given', () => {
    expect(statusColumn<Row>('name', 'Name').valueGetter).toBeUndefined();

    const mapped = statusColumn<Row>('isActive', 'Status', (r) =>
      r.isActive ? 'ACTIVE' : 'INACTIVE',
    );
    const getter = mapped.valueGetter as (p: ValueGetterParams<Row>) => string | null;
    expect(getter(getterParams(row))).toBe('ACTIVE');
    expect(getter(getterParams(undefined))).toBeNull();
  });

  it('derives a status column with no backing field', () => {
    const column = derivedStatusColumn<Row>('state', 'State', () => 'BLOCKED');
    expect(column).toMatchObject({ colId: 'state', sortable: false });
  });

  it('renders booleans through the shared chip', () => {
    expect(boolColumn<Row>('isActive', 'Active')).toMatchObject({
      field: 'isActive',
      filter: false,
    });
  });

  it('formats dates through the grid context and falls back to the empty text', () => {
    const formatDate = vi.fn(() => '01 Mar 2026');
    const column = dateColumn<Row>('dueDate', 'Due', '—');
    expect(format(column, row, { formatDate })).toBe('01 Mar 2026');
    expect(formatDate).toHaveBeenCalledWith('2026-03-01');
    expect(format(column, { ...row, dueDate: null }, { formatDate })).toBe('—');
  });

  it('sizes the actions column to the number of buttons', () => {
    expect(actionsColumn()).toMatchObject({ colId: 'actions', width: 120, minWidth: 120 });
    expect(actionsColumn([EDIT_ACTION, EDIT_ACTION, DELETE_ACTION]).width).toBe(150);
    expect(actionsColumn([EDIT_ACTION], 200).width).toBe(200);
  });

  it('pins the action specs to the column so handlers stay in the grid context', () => {
    const column = actionsColumn([EDIT_ACTION, DELETE_ACTION]);
    expect(column.cellRendererParams).toEqual({ actionSpecs: [EDIT_ACTION, DELETE_ACTION] });
  });
});
