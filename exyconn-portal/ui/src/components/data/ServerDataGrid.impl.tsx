import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  type ColDef,
  type GridReadyEvent,
  type IDatasource,
  type IGetRowsParams,
  type RowClickedEvent,
  type SortModelItem,
} from 'ag-grid-community';
import { Box, TextField, useTheme } from '@/components/ui';
import {
  FilterOp,
  SortDir,
  type TableFilterInput,
  type TableQueryInput,
  type TableSortInput,
} from '@/graphql/generated';

// ag-grid v33+ requires explicit module registration; the Community bundle covers the
// infinite row model, sorting and column text filters this grid relies on.
ModuleRegistry.registerModules([AllCommunityModule]);

const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_PAGE_SIZE = 25;

export interface TablePageResult<T> {
  rows: T[];
  totalCount: number;
}

export interface ServerDataGridProps<T> {
  columnDefs: ColDef<T>[];
  /** Fetches one page from the server for the given query. */
  fetchRows: (input: TableQueryInput) => Promise<TablePageResult<T>>;
  pageSize?: number;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  /** Passed to ag-grid so cell renderers can reach page-level handlers. */
  context?: unknown;
  /** Bump to force a reload after a create/update/delete elsewhere on the page. */
  refreshSignal?: number;
  height?: number | string;
}

const TEXT_FILTER_PARAMS = {
  filterOptions: ['contains', 'equals', 'startsWith'],
  maxNumConditions: 1,
  debounceMs: SEARCH_DEBOUNCE_MS,
};

/** Maps an ag-grid text-filter type to the server's FilterOp (defaulting to CONTAINS). */
function toFilterOp(type: string | undefined): FilterOp {
  if (type === 'equals') {
    return FilterOp.Equals;
  }
  if (type === 'startsWith') {
    return FilterOp.StartsWith;
  }
  return FilterOp.Contains;
}

/** Flattens ag-grid's per-column filter model into the server's filter list. */
function toFilters(model: Record<string, { type?: string; filter?: unknown }>): TableFilterInput[] {
  const filters: TableFilterInput[] = [];
  for (const [field, def] of Object.entries(model)) {
    const value = def.filter == null ? '' : String(def.filter);
    if (value !== '') {
      filters.push({ field, op: toFilterOp(def.type), value });
    }
  }
  return filters;
}

/** ag-grid allows multi-sort; the server sorts by a single column, so take the first. */
function toSort(sortModel: SortModelItem[]): TableSortInput | null {
  const first = sortModel[0];
  if (!first) {
    return null;
  }
  return { field: first.colId, dir: first.sort === 'desc' ? SortDir.Desc : SortDir.Asc };
}

/**
 * Server-driven data grid (implementation): ag-grid Community in its infinite row model, so
 * every page, sort and column filter is resolved by the server via `fetchRows`. Loaded lazily
 * through `ServerDataGrid` so ag-grid stays out of the main bundle. Styled from the MUI theme.
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
}: Readonly<ServerDataGridProps<unknown>>) {
  const theme = useTheme();
  const gridRef = useRef<AgGridReact<unknown>>(null);
  const searchRef = useRef('');
  const [search, setSearch] = useState('');

  const gridTheme = useMemo(
    () =>
      themeQuartz.withParams({
        accentColor: theme.palette.primary.main,
        backgroundColor: theme.palette.background.paper,
        foregroundColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        headerBackgroundColor: theme.palette.background.default,
        headerTextColor: theme.palette.text.secondary,
        rowHoverColor: theme.palette.action.hover,
        fontFamily: theme.typography.fontFamily,
        fontSize: 13,
        headerFontSize: 12,
        headerFontWeight: 700,
        wrapperBorderRadius: 8,
      }),
    [theme],
  );

  const defaultColDef = useMemo<ColDef<unknown>>(
    () => ({
      sortable: true,
      filter: 'agTextColumnFilter',
      filterParams: TEXT_FILTER_PARAMS,
      floatingFilter: true,
      resizable: true,
      flex: 1,
      minWidth: 120,
    }),
    [],
  );

  const datasource = useMemo<IDatasource>(
    () => ({
      getRows: (params: IGetRowsParams) => {
        const searchValue = searchRef.current.trim();
        const input: TableQueryInput = {
          page: Math.floor(params.startRow / pageSize),
          pageSize,
          search: searchValue === '' ? null : searchValue,
          sort: toSort(params.sortModel),
          filters: toFilters(params.filterModel as Record<string, { type?: string; filter?: unknown }>),
        };
        fetchRows(input)
          .then((page) => params.successCallback(page.rows, page.totalCount))
          .catch(() => params.failCallback());
      },
    }),
    [fetchRows, pageSize],
  );

  const onGridReady = useCallback(
    (event: GridReadyEvent) => event.api.setGridOption('datasource', datasource),
    [datasource],
  );

  // Debounce the search box, then reload from the first row.
  useEffect(() => {
    const id = setTimeout(() => {
      searchRef.current = search;
      gridRef.current?.api?.purgeInfiniteCache();
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  // Reload when the host signals an external data change (create/update/delete).
  useEffect(() => {
    if (refreshSignal > 0) {
      gridRef.current?.api?.purgeInfiniteCache();
    }
  }, [refreshSignal]);

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<unknown>) => {
      if (onRowClick && event.data) {
        onRowClick(event.data);
      }
    },
    [onRowClick],
  );

  return (
    <Box>
      <TextField
        size="small"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={{ mb: 1.5, width: { xs: '100%', sm: 320 } }}
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
