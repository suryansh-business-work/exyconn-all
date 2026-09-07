import { useCallback, useRef } from 'react';
import { useApolloClient } from '@apollo/client';
import type { DocumentNode } from 'graphql';
import type { TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid';
import type { TableFilterInput, TableQueryInput } from '@exyconn/shell/graphql/generated';

/**
 * Turns a generated `ListXxxPaged` document into the `fetchRows` callback
 * {@link ServerDataGrid} expects: one network-only query per page, sort and filter
 * the grid asks for. `select` picks the page off the query result and is what infers
 * the row type, so annotate its parameter with the generated query type:
 *
 * ```ts
 * const fetchRows = usePagedFetcher(ListLeadsPagedDocument, (d: ListLeadsPagedQuery) => d.listLeadsPaged);
 * ```
 *
 * `extraFilters` are appended to whatever the grid's own column filters ask for — a
 * quick-filter toggle, or a drawer scoped to one parent record. They are read at fetch
 * time, so changing them needs a `refreshSignal` bump to make the grid re-read.
 */
export function usePagedFetcher<TQuery, TRow>(
  document: DocumentNode,
  select: (data: TQuery) => TablePageResult<TRow>,
  extraFilters: readonly TableFilterInput[] = [],
): (input: TableQueryInput) => Promise<TablePageResult<TRow>> {
  const client = useApolloClient();
  // `select` and `extraFilters` are written inline at the call site, so keep the latest
  // ones in refs and leave the returned callback stable — the grid builds its
  // datasource from it.
  const selectRef = useRef(select);
  selectRef.current = select;
  const extraFiltersRef = useRef(extraFilters);
  extraFiltersRef.current = extraFilters;

  return useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<TRow>> => {
      const filters = [...(input.filters ?? []), ...extraFiltersRef.current];
      const result = await client.query<TQuery, { input: TableQueryInput }>({
        query: document,
        variables: { input: { ...input, filters } },
        fetchPolicy: 'network-only',
      });
      const page = selectRef.current(result.data);
      return { rows: page.rows, totalCount: page.totalCount };
    },
    [client, document],
  );
}
