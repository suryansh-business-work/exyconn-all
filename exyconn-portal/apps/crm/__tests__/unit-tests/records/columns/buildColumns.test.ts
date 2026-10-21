import { describe, expect, it } from 'vitest';
import type { ColDef, ValueGetterParams } from 'ag-grid-community';
import { CrmPropertyType, SortDir } from '@exyconn/shell/graphql/generated';
import {
  buildColumnDefs,
  columnChoices,
  columnId,
  visibleColumnIds,
} from '../../../../src/records/columns/buildColumns';
import type { CrmRecordRow, ValueFormatters } from '../../../../src/records/schema';
import { property, recordRow } from '../records-fixtures';

type Row = CrmRecordRow;

const FORMATTERS: ValueFormatters = {
  formatDate: String,
  formatNumber: (value) => `#${value}`,
  yes: 'Yes',
  no: 'No',
};

const PAGE: ColDef<Row>[] = [
  { field: 'name', headerName: 'Lead name' },
  { colId: 'client', headerName: 'Client' },
  { colId: 'actions', headerName: '' },
];
const NAME = property();
const EMAIL = property({ key: 'email', label: 'Email' });
const SEATS = property({
  key: 'seats',
  label: 'Seats',
  type: CrmPropertyType.Number,
  builtIn: false,
});

describe('columnId', () => {
  it('prefers the colId, then the field, then nothing', () => {
    expect(columnId({ colId: 'a', field: 'b' } as ColDef<Row>)).toBe('a');
    expect(columnId({ field: 'b' } as ColDef<Row>)).toBe('b');
    expect(columnId({})).toBe('');
  });
});

describe('columnChoices', () => {
  it('names each property the way the page column does, else by its label', () => {
    expect(columnChoices(PAGE, [NAME, SEATS])).toEqual([
      { id: 'name', label: 'Lead name', custom: false, translate: true },
      { id: 'seats', label: 'Seats', custom: true, translate: false },
    ]);
  });
});

describe('visibleColumnIds', () => {
  const choices = columnChoices(PAGE, [NAME, EMAIL]);

  it('keeps the view columns that still exist, in order', () => {
    expect(visibleColumnIds(PAGE, choices, ['email', 'gone', 'name'])).toEqual(['email', 'name']);
  });

  it('falls back to the page defaults without the actions column', () => {
    expect(visibleColumnIds(PAGE, choices, [])).toEqual(['name', 'client']);
    expect(visibleColumnIds(PAGE, choices, ['gone'])).toEqual(['name', 'client']);
  });
});

describe('buildColumnDefs', () => {
  it('lays out the page defaults with sorting on properties only and actions last', () => {
    const columns = buildColumnDefs({
      pageColumns: PAGE,
      properties: [NAME, EMAIL],
      visible: [],
      sorts: [{ property: 'name', dir: SortDir.Desc }],
      formatters: FORMATTERS,
    });
    expect(
      columns.map((column) => [columnId(column), column.sortable, column.initialSort]),
    ).toEqual([
      ['name', true, 'desc'],
      ['client', false, undefined],
      ['actions', undefined, undefined],
    ]);
    expect(columns[0]).toMatchObject({
      headerName: 'Lead name',
      filter: false,
      floatingFilter: false,
    });
  });

  it('adds a formatted cell for a property the page has no column for', () => {
    const columns = buildColumnDefs({
      pageColumns: PAGE,
      properties: [NAME, SEATS],
      visible: ['seats', 'name'],
      sorts: [],
      formatters: FORMATTERS,
    });
    expect(columns.map((column) => columnId(column))).toEqual(['seats', 'name', 'actions']);
    const getter = columns[0].valueGetter as (params: ValueGetterParams<Row>) => string;
    expect(getter({ data: recordRow({ custom: { seats: 40 } }) } as ValueGetterParams<Row>)).toBe(
      '#40',
    );
    expect(getter({ data: undefined } as ValueGetterParams<Row>)).toBe('');
  });

  it('sorts only the marked column and works without an actions column', () => {
    const columns = buildColumnDefs({
      pageColumns: [{ field: 'name' }],
      properties: [NAME],
      visible: ['name'],
      sorts: [{ property: 'email', dir: SortDir.Asc }],
      formatters: FORMATTERS,
    });
    expect(columns.map((column) => columnId(column))).toEqual(['name']);
    expect(columns[0].initialSort).toBeUndefined();
  });

  it('keeps a default page column known by neither colId nor field', () => {
    const choices = buildColumnDefs({
      pageColumns: [{ headerName: 'Nameless' }],
      properties: [],
      visible: [],
      sorts: [],
      formatters: FORMATTERS,
    });
    expect(choices).toEqual([expect.objectContaining({ headerName: 'Nameless', sortable: false })]);
  });
});
