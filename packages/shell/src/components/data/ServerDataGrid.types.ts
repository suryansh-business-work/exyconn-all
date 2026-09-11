import type { ColDef } from 'ag-grid-community';
import type { TableQueryInput } from '@/graphql/generated';
import type { GridQuery } from './serverGridQuery';

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
  context?: object;
  /** Bump to force a reload after a create/update/delete elsewhere on the page. */
  refreshSignal?: number;
  height?: number | string;
  /**
   * Told the search/sort/filters behind every page the grid loads, so an export can fetch
   * ALL rows with exactly the query the person is looking at.
   */
  onQuery?: (query: GridQuery) => void;
}
