import { useEffect, useImperativeHandle, type Ref } from 'react';
import type { ColDef, IDatasource } from 'ag-grid-community';
import { vi } from 'vitest';

/** What the fake grid was last rendered with, and what the component under test did to it. */
export const agGrid = {
  props: {} as FakeGridProps,
  datasource: null as IDatasource | null,
  purge: vi.fn(),
  /** `refreshInfiniteCache`: re-reads the loaded blocks in place. */
  refresh: vi.fn(),
  /** `refreshCells`: redraws the cells on screen (a format or language changed). */
  refreshCells: vi.fn(),
  setFilterModel: vi.fn(),
  deselectAll: vi.fn(),
  setNodesSelected: vi.fn(),
  /** The pager's current page, zero-based. */
  currentPage: 0,
  /** What each displayed row index holds; a null entry is a row still loading. */
  rows: [] as ReadonlyArray<object | null>,
  /** When false, the grid ref carries no api — as before ag-grid has finished starting up. */
  withApi: true,
};

export interface FakeGridProps {
  ref?: Ref<unknown>;
  columnDefs: ColDef<unknown>[];
  defaultColDef: ColDef<unknown>;
  context?: object;
  cacheBlockSize: number;
  paginationPageSize: number;
  paginationPageSizeSelector: number[];
  onFilterChanged: (event: { api: { isAnyFilterPresent: () => boolean } }) => void;
  onGridReady: (event: {
    api: { setGridOption: (key: string, value: IDatasource) => void };
  }) => void;
  onRowClicked?: (event: { data?: unknown }) => void;
  rowStyle?: object;
  rowSelection?: object;
  onSelectionChanged: (event: { api: { getSelectedRows: () => unknown[] } }) => void;
  onSortChanged: () => void;
}

/** The displayed row at `index` as ag-grid's infinite model gives it, or none past the end. */
function getDisplayedRowAtIndex(index: number): { data: object | undefined } | undefined {
  if (index >= agGrid.rows.length) {
    return undefined;
  }
  return { data: agGrid.rows[index] ?? undefined };
}

function setGridOption(key: string, value: IDatasource): void {
  if (key === 'datasource') {
    agGrid.datasource = value;
  }
}

/**
 * Stands in for ag-grid's React grid, which needs a real layout engine: it records its props,
 * hands the datasource over on ready, and exposes `purgeInfiniteCache`, `refreshInfiniteCache`,
 * `setFilterModel` and
 * the selection and pager calls the bulk actions use through the ref.
 */
export function FakeAgGrid(props: Readonly<FakeGridProps>) {
  agGrid.props = props;
  useImperativeHandle(props.ref, () =>
    agGrid.withApi
      ? {
          api: {
            purgeInfiniteCache: agGrid.purge,
            refreshInfiniteCache: agGrid.refresh,
            refreshCells: agGrid.refreshCells,
            setFilterModel: agGrid.setFilterModel,
            deselectAll: agGrid.deselectAll,
            setNodesSelected: agGrid.setNodesSelected,
            paginationGetPageSize: () => agGrid.props.paginationPageSize,
            paginationGetCurrentPage: () => agGrid.currentPage,
            getDisplayedRowAtIndex,
          },
        }
      : {},
  );
  const { onGridReady } = props;
  useEffect(() => {
    onGridReady({ api: { setGridOption } });
  }, [onGridReady]);
  return (
    <div data-testid="ag-grid">
      <table>
        <thead>
          <tr>
            {props.columnDefs.map((column) => (
              <th key={column.colId ?? column.field} scope="col">
                {column.headerName ?? column.colId ?? column.field}
              </th>
            ))}
          </tr>
        </thead>
      </table>
    </div>
  );
}

export function resetFakeGrid(): void {
  agGrid.props = {} as FakeGridProps;
  agGrid.datasource = null;
  agGrid.purge.mockClear();
  agGrid.refresh.mockClear();
  agGrid.refreshCells.mockClear();
  agGrid.setFilterModel.mockClear();
  agGrid.deselectAll.mockClear();
  agGrid.setNodesSelected.mockClear();
  agGrid.currentPage = 0;
  agGrid.rows = [];
  agGrid.withApi = true;
}
