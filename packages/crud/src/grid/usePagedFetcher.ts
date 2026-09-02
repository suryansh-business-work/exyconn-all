import { useCallback, useRef } from 'react';
import { useApolloClient } from '@apollo/client';
import type { DocumentNode } from 'graphql';
import type { TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid';
import type { TableQueryInput } from '@exyconn/shell/graphql/generated';

/**
 * Turns a generated `ListXxxPaged` document into the `fetchRows` callback
 * {@link ServerDataGrid} expects: one network-only query per page, sort and filter
 * the grid asks for. `select` picks the page off the query result and is what infers
 * the row type, so annotate its parameter with the generated query type:
 *
 * ```ts
 * const fetchRows = usePagedFetcher(ListLeadsPagedDocument, (d: ListLeadsPagedQuery) => d.listLeadsPaged);
 * ```
 */
export function usePagedFetcher<TQuery, TRow>(
  document: DocumentNode,
  select: (data: TQuery) => TablePageResult<TRow>,
): (input: TableQueryInput) => Promise<TablePageResult<TRow>> {
  const client = useApolloClient();
  // `select` is written inline at the call site, so keep the latest one in a ref and
  // leave the returned callback stable — the grid builds its datasource from it.
  const selectRef = useRef(select);
  selectRef.current = select;

  return useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<TRow>> => {
      const result = await client.query<TQuery, { input: TableQueryInput }>({
        query: document,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      const page = selectRef.current(result.data);
      return { rows: page.rows, totalCount: page.totalCount };
    },
    [client, document],
  );
}
