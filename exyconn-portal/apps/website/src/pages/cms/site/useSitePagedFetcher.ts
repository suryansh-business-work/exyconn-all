import { useCallback, useRef } from 'react';
import type { TypedDocumentNode } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import type { TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid';
import type { TableQueryInput } from '@exyconn/shell/graphql/generated';
import { queryData } from '@exyconn/shell/utils/queryData';

/** The arguments the CMS's site lists take instead of the generic table query. */
export interface SitePageVariables {
  siteId: string;
  page: number;
  pageSize: number;
  search: string | null;
}

/**
 * The grid fetcher for a site list that takes `(siteId, page, pageSize, search)` — newsletter
 * issues and subscribers. The grid's page and search map straight across; its column sort and
 * filters have no server counterpart there, so those columns are display-only.
 */
export function useSitePagedFetcher<TQuery, TRow>(
  document: TypedDocumentNode<TQuery, SitePageVariables>,
  select: (data: TQuery) => TablePageResult<TRow>,
  siteId: string,
): (input: TableQueryInput) => Promise<TablePageResult<TRow>> {
  const client = useApolloClient();
  const selectRef = useRef(select);
  selectRef.current = select;

  return useCallback(
    async (input: TableQueryInput) => {
      const result = await client.query({
        query: document,
        variables: {
          siteId,
          page: input.page,
          pageSize: input.pageSize,
          search: input.search ?? null,
        },
        fetchPolicy: 'network-only',
      });
      const page = selectRef.current(queryData(result, 'The list'));
      return { rows: page.rows, totalCount: page.totalCount };
    },
    [client, document, siteId],
  );
}
