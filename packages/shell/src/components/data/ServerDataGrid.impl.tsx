import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ModuleRegistry,
  AllCommunityModule,
  type ColDef,
  type FilterChangedEvent,
  type GridReadyEvent,
  type RowClickedEvent,
} from 'ag-grid-community';
import { useT } from '@exyconn/i18n';
import { Box, useMediaQuery, useTheme } from '@/components/ui';
import { SEARCH_DEBOUNCE_MS, TEXT_FILTER_PARAMS } from './serverGridQuery';
import { skeletonWhileLoading } from './GridSkeletonCell';
import { applyTableInfo } from './tableColumns';
import { useServerDatasource } from './useServerDatasource';
import { useTableInfo } from './useTableInfo';

/**
 * What a grid gets on a phone: most of the viewport, minus the chrome above it, so the page
 * scrolls once rather than nesting a second scroll inside a third.
 */
const PHONE_GRID_HEIGHT = 'calc(100dvh - 240px)';
import { ServerGridToolbar } from './ServerGridToolbar';
import { useGridTheme } from './useGridTheme';
import { useLoadingLock } from './useLoadingLock';
import type { ServerDataGridProps } from './ServerDataGrid.types';

// ag-grid v33+ requires explicit module registration; the Community bundle covers the
// infinite row model, sorting and column text filters this grid relies on.
ModuleRegistry.registerModules([AllCommunityModule]);

const DEFAULT_PAGE_SIZE = 25;
/** What the pager offers; a grid built with another size gets that size offered first. */
const PAGE_SIZE_OPTIONS = [25, 50, 100];

export type { GridQuery } from './serverGridQuery';
export type { GridFetcher, ServerDataGridProps, TablePageResult } from './ServerDataGrid.types';

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
  initialSearch = '',
  onRowClick,
  context,
  refreshSignal = 0,
  height = 560,
  onQuery,
}: Readonly<ServerDataGridProps<unknown>>) {
  const gridTheme = useGridTheme();
  const theme = useTheme();
  // A phone shows about three of these columns at a time, so the grid stops pretending to be
  // a spreadsheet: no filter row under the headers, and a height that leaves the page's own
  // scroll usable instead of burying the paginator below the fold.
  const onPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const t = useT();
  const tableInfo = useTableInfo(fetchRows.list);
  // Column headings are English strings in each module's column model; translating them here
  // means a register reads in the person's language without sixty files knowing about it.
  // Filters and sorts then follow what the server says the list honours.
  const headings = useMemo(() => {
    const translated = columnDefs.map((column) =>
      column.headerName ? { ...column, headerName: t(column.headerName) } : column,
    );
    return tableInfo ? applyTableInfo(translated, tableInfo) : translated;
  }, [columnDefs, t, tableInfo]);
  const gridRef = useRef<AgGridReact<unknown>>(null);
  // The trimmed search the grid last loaded with; the box's live text debounces into it.
  const searchRef = useRef(initialSearch.trim());
  const [search, setSearch] = useState(initialSearch);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filtered, setFiltered] = useState(false);
  const lock = useLoadingLock();

  const defaultColDef = useMemo<ColDef<unknown>>(
    () => ({
      sortable: true,
      filter: 'agTextColumnFilter',
      filterParams: TEXT_FILTER_PARAMS,
      floatingFilter: !onPhone,
      resizable: true,
      flex: 1,
      minWidth: 120,
      cellRendererSelector: skeletonWhileLoading,
    }),
    [onPhone],
  );

  const { begin, end } = lock;
  const datasource = useServerDatasource({
    fetchRows,
    searchRef,
    onQuery,
    begin,
    end,
    onLoadError: setLoadError,
  });

  const onGridReady = useCallback(
    (event: GridReadyEvent) => event.api.setGridOption('datasource', datasource),
    [datasource],
  );

  const reload = useCallback(() => gridRef.current?.api?.purgeInfiniteCache(), []);
  const clearFilters = useCallback(() => gridRef.current?.api?.setFilterModel(null), []);
  const onFilterChanged = useCallback(
    (event: FilterChangedEvent) => setFiltered(event.api.isAnyFilterPresent()),
    [],
  );
  const pageSizes = PAGE_SIZE_OPTIONS.includes(pageSize)
    ? PAGE_SIZE_OPTIONS
    : [pageSize, ...PAGE_SIZE_OPTIONS];

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
        onClearFilters={filtered ? clearFilters : undefined}
      />
      <Box sx={{ height: onPhone ? PHONE_GRID_HEIGHT : height, width: '100%' }}>
        <AgGridReact<unknown>
          ref={gridRef}
          theme={gridTheme}
          columnDefs={headings}
          defaultColDef={defaultColDef}
          context={context}
          rowModelType="infinite"
          cacheBlockSize={pageSize}
          infiniteInitialRowCount={pageSize}
          pagination
          paginationPageSize={pageSize}
          paginationPageSizeSelector={pageSizes}
          onGridReady={onGridReady}
          onFilterChanged={onFilterChanged}
          onRowClicked={onRowClick ? handleRowClicked : undefined}
          rowStyle={onRowClick ? { cursor: 'pointer' } : undefined}
        />
      </Box>
    </Box>
  );
}

export default ServerDataGridImpl;
