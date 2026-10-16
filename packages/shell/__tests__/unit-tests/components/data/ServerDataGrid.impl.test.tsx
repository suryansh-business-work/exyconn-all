import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { FilterOp, SortDir, TableFieldKind, TableInfoDocument } from '@/graphql/generated';
import { EnumColumnFilter } from '@/components/data/EnumColumnFilter';
import type { TablePageResult } from '@/components/data/ServerDataGrid.impl';
import { portalLogger } from '@/logging/portalLogger';
import { agGrid, resetFakeGrid } from './fakeAgGrid';
import { getRowsParams, listFetcher, loadPage, renderGrid, type Fetch } from './serverGridHarness';
import { answer, failure } from '../../mockResult';

vi.mock('ag-grid-react', async () => {
  const { FakeAgGrid } = await import('./fakeAgGrid');
  return { AgGridReact: FakeAgGrid };
});

interface Row {
  id: string;
}

beforeEach(() => {
  resetFakeGrid();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ServerDataGridImpl setup', () => {
  it('translates headings and uses the default page size, placeholder and height', () => {
    renderGrid(vi.fn<Fetch>());

    expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'code' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Buscar…' })).toBeInTheDocument();
    expect(agGrid.props.cacheBlockSize).toBe(25);
    expect(agGrid.props.defaultColDef.floatingFilter).toBe(true);
    expect(screen.getByTestId('ag-grid').parentElement).toHaveStyle({ height: '560px' });
    expect(agGrid.props.onRowClicked).toBeUndefined();
    expect(agGrid.props.rowStyle).toBeUndefined();
  });

  it('drops the filter row and fills the viewport on a phone', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );
    renderGrid(vi.fn<Fetch>(), { height: 400 });

    expect(agGrid.props.defaultColDef.floatingFilter).toBe(false);
    const frame = screen.getByTestId('ag-grid').parentElement as HTMLElement;
    expect(getComputedStyle(frame).height).not.toBe('400px');
    vi.unstubAllGlobals();
  });
});

describe('ServerDataGridImpl paging', () => {
  it('asks the server for the page, sort and filters and locks the grid meanwhile', async () => {
    let answer: (page: TablePageResult<unknown>) => void = () => undefined;
    const fetchRows = vi.fn<Fetch>(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );
    const onQuery = vi.fn();
    const { container } = renderGrid(fetchRows, { pageSize: 10, onQuery });
    const params = getRowsParams({
      startRow: 20,
      endRow: 30,
      sortModel: [
        { colId: 'name', sort: 'desc' },
        { colId: 'code', sort: 'asc' },
      ],
      filterModel: {
        code: { type: 'equals', filter: 'A1' },
        createdAt: { filterType: 'dateRange', from: '2026-03-01', to: null },
      },
    });

    await loadPage(params);
    const expectedQuery = {
      search: null,
      sort: { field: 'name', dir: SortDir.Desc },
      sorts: [
        { field: 'name', dir: SortDir.Desc },
        { field: 'code', dir: SortDir.Asc },
      ],
      filters: [
        { field: 'code', op: FilterOp.Equals, value: 'A1' },
        // The day starts at midnight in the configured timezone (Asia/Kolkata), not UTC.
        { field: 'createdAt', op: FilterOp.Gte, value: '2026-02-28T18:30:00.000Z' },
      ],
    };
    expect(onQuery).toHaveBeenCalledWith(expectedQuery);
    expect(fetchRows).toHaveBeenCalledWith({ ...expectedQuery, page: 2, pageSize: 10 });
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Refresh table' })).toBeDisabled();

    const rows: Row[] = [{ id: 'r1' }];
    await act(async () => {
      answer({ rows, totalCount: 31 });
    });
    expect(params.successCallback).toHaveBeenCalledWith(rows, 31);
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'false');
  });

  it('reports a failed page until a later one loads', async () => {
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    const fetchRows = vi
      .fn<Fetch>()
      .mockRejectedValueOnce(new Error('Gateway timeout'))
      .mockResolvedValueOnce({ rows: [], totalCount: 0 });
    renderGrid(listFetcher(fetchRows, 'listClientsPaged'));
    const failed = getRowsParams();

    await loadPage(failed);
    expect(failed.failCallback).toHaveBeenCalled();
    expect(logged).toHaveBeenCalledWith('Could not load the grid page', expect.any(Error), {
      list: 'listClientsPaged',
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the rows (Gateway timeout). Use Refresh to try again.',
    );

    await loadPage(getRowsParams());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('explains a failure that is not an Error', async () => {
    vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    const fetchRows = vi.fn<Fetch>().mockRejectedValue('offline');
    renderGrid(fetchRows);

    await loadPage(getRowsParams());
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the rows (The server did not answer).',
    );
  });

  it('sends the search box text once it has loaded with one', async () => {
    const fetchRows = vi.fn<Fetch>().mockResolvedValue({ rows: [], totalCount: 0 });
    renderGrid(fetchRows, { initialSearch: '  acme ' });

    await loadPage(getRowsParams({ startRow: 50, endRow: 100 }));
    expect(fetchRows).toHaveBeenCalledWith({
      search: 'acme',
      sort: null,
      sorts: [],
      filters: [],
      page: 1,
      pageSize: 50,
    });
  });
});

describe('ServerDataGridImpl page sizes and filters', () => {
  it('offers 25, 50 and 100 rows a page, and a grid’s own size first when it is another', () => {
    const { unmount } = renderGrid(vi.fn<Fetch>(), { pageSize: 50 });
    expect(agGrid.props.paginationPageSize).toBe(50);
    expect(agGrid.props.paginationPageSizeSelector).toEqual([25, 50, 100]);
    unmount();

    renderGrid(vi.fn<Fetch>(), { pageSize: 10 });
    expect(agGrid.props.paginationPageSizeSelector).toEqual([10, 25, 50, 100]);
  });

  it('offers Clear filters only while a column filter is applied, and clears them all', () => {
    renderGrid(vi.fn<Fetch>());
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();

    act(() => agGrid.props.onFilterChanged({ api: { isAnyFilterPresent: () => true } }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(agGrid.setFilterModel).toHaveBeenCalledWith(null);

    act(() => agGrid.props.onFilterChanged({ api: { isAnyFilterPresent: () => false } }));
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });
});

describe('ServerDataGridImpl table info', () => {
  const tableInfo = {
    __typename: 'TableInfo',
    filters: [
      {
        __typename: 'TableFilterColumn',
        field: 'status',
        kind: TableFieldKind.Enum,
        options: ['OPEN'],
      },
    ],
    sortFields: ['name'],
    importable: false,
    matchFields: [],
    importFields: [],
  };

  it('lets each column filter and sort only as the server’s list allows', async () => {
    const tracked = answer(TableInfoDocument, { tableInfo }, { list: 'listLeadsPaged' });
    renderGrid(
      listFetcher(vi.fn<Fetch>(), 'listLeadsPaged'),
      {
        columnDefs: [
          { field: 'name', headerName: 'Name' },
          { field: 'status' },
          { colId: 'actions' },
        ],
      },
      [tracked.mock],
    );
    await waitFor(() => expect(tracked.delivered()).toBe(true));

    await waitFor(() =>
      expect(agGrid.props.columnDefs).toEqual([
        {
          field: 'name',
          headerName: 'Nombre',
          sortable: true,
          filter: false,
          floatingFilter: false,
        },
        {
          field: 'status',
          sortable: false,
          filter: EnumColumnFilter,
          filterParams: { options: ['OPEN'] },
        },
        { colId: 'actions' },
      ]),
    );
  });

  it('keeps the column factories’ filters when the list cannot be described, and logs why', async () => {
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    renderGrid(
      listFetcher(vi.fn<Fetch>(), 'listLeadsPaged'),
      { columnDefs: [{ field: 'name', headerName: 'Name' }] },
      [failure(TableInfoDocument, { list: 'listLeadsPaged' })],
    );

    await waitFor(() =>
      expect(logged).toHaveBeenCalledWith(
        'Could not load what the grid may filter and sort',
        expect.any(Error),
        { list: 'listLeadsPaged' },
      ),
    );
    expect(agGrid.props.columnDefs).toEqual([{ field: 'name', headerName: 'Nombre' }]);
  });
});
