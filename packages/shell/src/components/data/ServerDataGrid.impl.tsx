import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ModuleRegistry,
  AllCommunityModule,
  type ColDef,
  type GridReadyEvent,
  type IDatasource,
  type IGetRowsParams,
  type RowClickedEvent,
} from 'ag-grid-community';
import { Box } from '@/components/ui';
import type { TableQueryInput } from '@/graphql/generated';
import { errorMessage } from '@/utils/errorMessage';
import {
  SEARCH_DEBOUNCE_MS,
  TEXT_FILTER_PARAMS,
  toFilters,
  toSort,
  type GridQuery,
} from './serverGridQuery';
import { skeletonWhileLoading } from './GridSkeletonCell';
import { ServerGridToolbar } from './ServerGridToolbar';
import { useGridTheme } from './useGridTheme';
import { useLoadingLock } from './useLoadingLock';
import type { ServerDataGridProps } from './ServerDataGrid.types';

// ag-grid v33+ requires explicit module registration; the Community bundle covers the
// infinite row model, sorting and column text filters this grid relies on.
ModuleRegistry.registerModules([AllCommunityModule]);

const DEFAULT_PAGE_SIZE = 25;

export type { GridQuery } from './serverGridQuery';
export type { ServerDataGridProps, TablePageResult } from './ServerDataGrid.types';

/**
 * Server-driven data grid (implementation): ag-grid Community in its infinite row model, so
 * every page, sort and column filter is resolved by the server via `fetchRows`. Loaded lazily
 * through `ServerDataGrid` so ag-grid stays out of the main bundle. Styled from the MUI theme.
 *
 * While a page is loading its rows draw skeletons and the whole grid — search, refresh,
 * sorting, filters, pager and row actions — is locked until the server answers.
 */
function ServerDataGridImpl({
  columnDefs,
  fetchRows,
  pageSize = DEFAULT_PAGE_SIZE,
  searchPlaceholder = 'Search…',
  onRowClick,
  context,
  refreshSignal = 0,
  height = 560,
  onQuery,
}: Readonly<ServerDataGridProps<unknown>>) {
  const gridTheme = useGridTheme();
  const gridRef = useRef<AgGridReact<unknown>>(null);
  // The trimmed search the grid last loaded with; the box's live text debounces into it.
  const searchRef = useRef('');
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const lock = useLoadingLock();

  const defaultColDef = useMemo<ColDef<unknown>>(
    () => ({
      sortable: true,
      filter: 'agTextColumnFilter',
      filterParams: TEXT_FILTER_PARAMS,
      floatingFilter: true,
      resizable: true,
      flex: 1,
      minWidth: 120,
      cellRendererSelector: skeletonWhileLoading,
    }),
    [],
  );

  const { begin, end } = lock;
  const datasource = useMemo<IDatasource>(
    () => ({
      getRows: (params: IGetRowsParams) => {
        const query: GridQuery = {
          search: searchRef.current === '' ? null : searchRef.current,
          sort: toSort(params.sortModel),
          filters: toFilters(
            params.filterModel as Record<string, { type?: string; filter?: unknown }>,
          ),
        };
        onQuery?.(query);
        const input: TableQueryInput = {
          ...query,
          page: Math.floor(params.startRow / pageSize),
          pageSize,
        };
        begin();
        fetchRows(input)
          .then((page) => {
            setLoadError(null);
            params.successCallback(page.rows, page.totalCount);
          })
          .catch((error: unknown) => {
            console.error('Could not load the grid page', error);
            setLoadError(errorMessage(error, 'The server did not answer'));
            params.failCallback();
          })
          .finally(end);
      },
    }),
    [fetchRows, pageSize, onQuery, begin, end],
  );

  const onGridReady = useCallback(
    (event: GridReadyEvent) => event.api.setGridOption('datasource', datasource),
    [datasource],
  );

  const reload = useCallback(() => gridRef.current?.api?.purgeInfiniteCache(), []);

  // Debounce the search box, then reload from the first row — but only when the text the
  // grid would search for actually changed, so mounting or re-typing the same value is free.
  useEffect(() => {
    const next = search.trim();
    if (next === searchRef.current) {
      return undefined;
    }
    const id = setTimeout(() => {
      searchRef.current = next;
      reload();
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search, reload]);

  // Reload when the host signals an external data change (create/update/delete).
  useEffect(() => {
    if (refreshSignal > 0) {
      reload();
    }
  }, [refreshSignal, reload]);

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<unknown>) => {
      if (onRowClick && event.data) {
        onRowClick(event.data);
      }
    },
    [onRowClick],
  );

  return (
    <Box ref={lock.containerRef} inert={lock.loading} aria-busy={lock.loading}>
      <ServerGridToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        onRefresh={reload}
        loading={lock.loading}
        loadError={loadError}
      />
      <Box sx={{ height, width: '100%' }}>
        <AgGridReact<unknown>
          ref={gridRef}
          theme={gridTheme}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          context={context}
          rowModelType="infinite"
          cacheBlockSize={pageSize}
          infiniteInitialRowCount={pageSize}
          pagination
          paginationPageSize={pageSize}
          paginationPageSizeSelector={false}
          onGridReady={onGridReady}
          onRowClicked={onRowClick ? handleRowClicked : undefined}
          rowStyle={onRowClick ? { cursor: 'pointer' } : undefined}
        />
      </Box>
    </Box>
  );
}

export default ServerDataGridImpl;
