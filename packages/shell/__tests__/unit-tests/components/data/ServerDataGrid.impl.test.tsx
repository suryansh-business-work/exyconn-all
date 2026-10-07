import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { FilterOp, SortDir } from '@/graphql/generated';
import type { TablePageResult } from '@/components/data/ServerDataGrid.impl';
import { agGrid, resetFakeGrid } from './fakeAgGrid';
import { getRowsParams, loadPage, renderGrid, type Fetch } from './serverGridHarness';

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
    renderGrid(vi.fn());

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
    renderGrid(vi.fn(), { height: 400 });

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
      sortModel: [{ colId: 'name', sort: 'desc' }],
      filterModel: { code: { type: 'equals', filter: 'A1' } },
    });

    await loadPage(params);
    const expectedQuery = {
      search: null,
      sort: { field: 'name', dir: SortDir.Desc },
      filters: [{ field: 'code', op: FilterOp.Equals, value: 'A1' }],
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
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchRows = vi
      .fn<Fetch>()
      .mockRejectedValueOnce(new Error('Gateway timeout'))
      .mockResolvedValueOnce({ rows: [], totalCount: 0 });
    renderGrid(fetchRows);
    const failed = getRowsParams();

    await loadPage(failed);
    expect(failed.failCallback).toHaveBeenCalled();
    expect(logged).toHaveBeenCalledWith('Could not load the grid page', expect.any(Error));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the rows (Gateway timeout). Use Refresh to try again.',
    );

    await loadPage(getRowsParams());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
