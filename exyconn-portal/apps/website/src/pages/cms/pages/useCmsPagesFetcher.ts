import { useCallback, useRef } from 'react';
import { useApolloClient } from '@apollo/client/react';
import type { TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid';
import {
  CmsPagesDocument,
  type CmsDocumentStatus,
  type CmsPageKind,
  type CmsPagesQuery,
  type CmsPagesQueryVariables,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { queryData } from '@exyconn/shell/utils/queryData';
import type { CmsPageRow } from './pages-grid';

export interface PageFilters {
  status: CmsDocumentStatus | '';
  kind: CmsPageKind | '';
}

/**
 * The grid's fetcher for a site's pages. `cmsPages` takes its own list input (search, status
 * and kind), not the generic table query, so the grid's page and search are mapped onto it
 * and the toolbar's filters are read at fetch time.
 */
export function useCmsPagesFetcher(siteId: string, filters: PageFilters) {
  const client = useApolloClient();
  const latest = useRef(filters);
  latest.current = filters;

  return useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<CmsPageRow>> => {
      const { status, kind } = latest.current;
      const result = await client.query<CmsPagesQuery, CmsPagesQueryVariables>({
        query: CmsPagesDocument,
        variables: {
          siteId,
          input: {
            page: input.page,
            pageSize: input.pageSize,
            search: input.search ?? null,
            status: status || null,
            kind: kind || null,
          },
        },
        fetchPolicy: 'network-only',
      });
      const page = queryData(result, 'The pages list').cmsPages;
      return { rows: page.rows, totalCount: page.totalCount };
    },
    [client, siteId],
  );
}
