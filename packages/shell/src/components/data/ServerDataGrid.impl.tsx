import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ModuleRegistry,
  AllCommunityModule,
  type FilterChangedEvent,
  type GridReadyEvent,
  type RowClickedEvent,
} from 'ag-grid-community';
import { useT } from '@exyconn/i18n';
import { Box, useMediaQuery, useTheme } from '@/components/ui';
import {
  BULK_SELECTION,
  DEFAULT_PAGE_SIZE,
  PHONE_GRID_HEIGHT,
  defaultColDefFor,
  pageSizesFor,
} from './gridDefaults';
import { applyTableInfo } from './tableColumns';
import { GridBulkBar, GridBulkControls } from './GridBulkBar';
import { useGridSearch } from './useGridSearch';
import { useServerDatasource } from './useServerDatasource';
import { useTableBulk } from './useTableBulk';
import { useTableInfo } from './useTableInfo';
import { ServerGridToolbar } from './ServerGridToolbar';
import { useGridTheme } from './useGridTheme';
import { useLoadingLock } from './useLoadingLock';
import type { ServerDataGridProps } from './ServerDataGrid.types';

// ag-grid v33+ requires explicit module registration; the Community bundle covers the
// infinite row model, sorting and column text filters this grid relies on.
ModuleRegistry.registerModules([AllCommunityModule]);

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
  bulkList,
  onBulkDone,
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
  const purge = useCallback(() => gridRef.current?.api?.purgeInfiniteCache(), []);
  const bulk = useTableBulk({
    list: bulkList ?? fetchRows.list,
    gridRef,
    reload: purge,
    onDone: onBulkDone,
  });
  const { clearSelection } = bulk;
  // Rows are selected by position, so whatever re-reads them drops the selection first.
  const reload = useCallback(() => {
    clearSelection();
    purge();
  }, [clearSelection, purge]);
  const { search, setSearch, searchRef } = useGridSearch(initialSearch, reload);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filtered, setFiltered] = useState(false);
  const lock = useLoadingLock();

  const defaultColDef = useMemo(() => defaultColDefFor(onPhone), [onPhone]);

  const { begin, end } = lock;
  const datasource = useServerDatasource({
    fetchRows,
    searchRef,
    archivedRef: bulk.archivedRef,
    onQuery,
    begin,
    end,
    onLoadError: setLoadError,
  });

  const onGridReady = useCallback(
    (event: GridReadyEvent) => event.api.setGridOption('datasource', datasource),
    [datasource],
  );

  const clearFilters = useCallback(() => gridRef.current?.api?.setFilterModel(null), []);
  const onFilterChanged = useCallback(
    (event: FilterChangedEvent) => {
      clearSelection();
      setFiltered(event.api.isAnyFilterPresent());
    },
    [clearSelection],
  );
  const pageSizes = pageSizesFor(pageSize);

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
      >
        {bulk.enabled && <GridBulkControls bulk={bulk} loading={lock.loading} />}
      </ServerGridToolbar>
      {bulk.enabled && <GridBulkBar bulk={bulk} loading={lock.loading} />}
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
          onSortChanged={clearSelection}
          rowSelection={bulk.enabled ? BULK_SELECTION : undefined}
          onSelectionChanged={bulk.onSelectionChanged}
          onRowClicked={onRowClick ? handleRowClicked : undefined}
          rowStyle={onRowClick ? { cursor: 'pointer' } : undefined}
        />
      </Box>
    </Box>
  );
}

export default ServerDataGridImpl;
