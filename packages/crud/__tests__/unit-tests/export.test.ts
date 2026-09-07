import { describe, expect, it, vi } from 'vitest';
import {
  dateColumn,
  derivedColumn,
  actionsColumn,
  statusColumn,
  textColumn,
  valueColumn,
} from '../../src/grid/columns';
import { csvColumnsFromDefs, fetchAllRows } from '../../src/page/export';

interface Row {
  name: string;
  amount: number;
  status: string;
  dueDate: string | null;
  owner: { email: string };
}

const row: Row = {
  name: 'Acme',
  amount: 1500,
  status: 'OPEN',
  dueDate: '2026-03-01',
  owner: { email: 'a@b.c' },
};

const context = { actions: {}, formatDate: (value: string) => `formatted:${value}` };

describe('csvColumnsFromDefs', () => {
  it('keeps the visible columns, headed as the grid heads them, and drops the actions', () => {
    const columns = csvColumnsFromDefs<Row>(
      [textColumn('name', 'Name'), statusColumn('status', 'Status'), actionsColumn()],
      context,
    );
    expect(columns.map((column) => column.header)).toEqual(['Name', 'Status']);
    expect(columns.map((column) => column.value(row))).toEqual(['Acme', 'OPEN']);
  });

  it('exports what the cell shows: formatted values and derived text', () => {
    const columns = csvColumnsFromDefs<Row>(
      [
        valueColumn('amount', 'Amount', (r) => `INR ${r.amount}`),
        derivedColumn('owner', 'Owner', (r) => r.owner.email.toUpperCase()),
      ],
      context,
    );
    expect(columns.map((column) => column.value(row))).toEqual(['INR 1500', 'A@B.C']);
  });

  it('formats a date column through the context, as the grid does', () => {
    const [column] = csvColumnsFromDefs<Row>([dateColumn('dueDate', 'Due', '—')], context);
    expect(column.value(row)).toBe('formatted:2026-03-01');
    expect(column.value({ ...row, dueDate: null })).toBe('—');
  });

  it('reads a dotted field the way ag-grid resolves it', () => {
    const [column] = csvColumnsFromDefs<Row>(
      [{ field: 'owner.email', headerName: 'Email' }],
      context,
    );
    expect(column.value(row)).toBe('a@b.c');
  });

  it('skips a column with no heading or no way to read a value', () => {
    const columns = csvColumnsFromDefs<Row>(
      [
        { field: 'name', headerName: '' },
        { colId: 'chips', headerName: 'Chips' },
        { field: 'name', headerName: 'Name' },
      ],
      context,
    );
    expect(columns.map((column) => column.header)).toEqual(['Name']);
  });
});

describe('fetchAllRows', () => {
  it('walks every page under the same query until the server total is reached', async () => {
    const fetchRows = vi.fn(async ({ page }: { page: number }) => ({
      rows: page === 0 ? [1, 2] : [3],
      totalCount: 3,
    }));
    const query = { search: 'a', sort: null, filters: [] };

    const rows = await fetchAllRows(fetchRows, query, 2);

    expect(rows).toEqual([1, 2, 3]);
    expect(fetchRows).toHaveBeenCalledTimes(2);
    expect(fetchRows).toHaveBeenNthCalledWith(2, { ...query, page: 1, pageSize: 2 });
  });

  it('stops on an empty page even if the reported total says otherwise', async () => {
    const fetchRows = vi.fn(async () => ({ rows: [] as number[], totalCount: 10 }));

    await expect(
      fetchAllRows(fetchRows, { search: null, sort: null, filters: [] }),
    ).resolves.toEqual([]);
    expect(fetchRows).toHaveBeenCalledTimes(1);
  });
});
