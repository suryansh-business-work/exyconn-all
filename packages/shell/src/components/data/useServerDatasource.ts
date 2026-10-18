import { useMemo, type RefObject } from 'react';
import type { IDatasource, IGetRowsParams } from 'ag-grid-community';
import { useI18n } from '@exyconn/i18n';
import type { TableQueryInput } from '@/graphql/generated';
import { portalLogger } from '@/logging/portalLogger';
import { errorMessage } from '@/utils/errorMessage';
import { toFilters, toSorts, type GridQuery } from './serverGridQuery';
import type { GridFetcher } from './ServerDataGrid.types';

interface DatasourceOptions {
  fetchRows: GridFetcher<unknown>;
  /** The search the grid loads with; the toolbar's box debounces into it. */
  searchRef: RefObject<string>;
  /** The Archived switch: true lists only archived rows, otherwise they are left out. */
  archivedRef: RefObject<boolean>;
  onQuery?: (query: GridQuery) => void;
  /** Called as a page starts and settles, so the grid can lock while it loads. */
  begin: () => void;
  end: () => void;
  /** The last request's failure, or null once one succeeds. */
  onLoadError: (message: string | null) => void;
}

/** The query behind one block of rows: search, every sort level and the column filters. */
function queryOf(params: IGetRowsParams, search: string, zone: string): GridQuery {
  const sorts = toSorts(params.sortModel);
  return {
    search: search === '' ? null : search,
    // The first level on its own too: a fetcher built on its own query input reads `sort`.
    sort: sorts[0] ?? null,
    sorts,
    filters: toFilters(params.filterModel, zone),
  };
}

/**
 * ag-grid's infinite-row datasource for a server-paged grid: every block of rows is one
 * request to `fetchRows`, asking for exactly the block the grid wants (its size follows the
 * page-size picker). Date filters are read in the admin-configured timezone.
 */
export function useServerDatasource({
  fetchRows,
  searchRef,
  archivedRef,
  onQuery,
  begin,
  end,
  onLoadError,
}: DatasourceOptions): IDatasource {
  const zone = useI18n().settings.timezone;
  return useMemo<IDatasource>(
    () => ({
      getRows: (params: IGetRowsParams) => {
        const query = queryOf(params, searchRef.current, zone);
        onQuery?.(query);
        const pageSize = params.endRow - params.startRow;
        const input: TableQueryInput = {
          ...query,
          page: Math.floor(params.startRow / pageSize),
          pageSize,
          // Left out unless switched on, so a fetcher that forwards the input to a query of
          // its own never sends a field that query does not declare.
          archived: archivedRef.current || undefined,
        };
        begin();
        fetchRows(input)
          .then((page) => {
            onLoadError(null);
            params.successCallback(page.rows, page.totalCount);
          })
          .catch((error: unknown) => {
            portalLogger.error('Could not load the grid page', error, { list: fetchRows.list });
            onLoadError(errorMessage(error, 'The server did not answer'));
            params.failCallback();
          })
          .finally(end);
      },
    }),
    [fetchRows, searchRef, archivedRef, onQuery, begin, end, onLoadError, zone],
  );
}
