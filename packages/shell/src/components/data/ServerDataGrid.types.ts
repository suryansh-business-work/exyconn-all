import type { ColDef } from 'ag-grid-community';
import type { TableQueryInput } from '@/graphql/generated';
import type { GridQuery } from './serverGridQuery';

export interface TablePageResult<T> {
  rows: T[];
  totalCount: number;
}

/** Fetches one page from the server for the given query. */
export type GridFetcher<T> = ((input: TableQueryInput) => Promise<TablePageResult<T>>) & {
  /**
   * The paged list query it reads (`listClientsPaged`), set by `usePagedFetcher`. With it the
   * grid asks the server which columns filter and sort (`tableInfo`), and the list can be
   * exported and imported on the server; a fetcher on its own query input leaves it unset.
   */
  readonly list?: string;
};

export interface ServerDataGridProps<T> {
  columnDefs: ColDef<T>[];
  fetchRows: GridFetcher<T>;
  pageSize?: number;
  searchPlaceholder?: string;
  /** What the search box holds when the grid mounts — a saved view's search, say. */
  initialSearch?: string;
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
