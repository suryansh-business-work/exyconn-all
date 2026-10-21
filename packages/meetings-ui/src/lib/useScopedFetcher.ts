import { useMemo, useRef } from 'react';
import { useApolloClient } from '@apollo/client/react';
import type { DocumentNode } from 'graphql';
import { listFieldOf } from '@exyconn/crud/grid/usePagedFetcher';
import type { GridFetcher, TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid';
import type { TableFilterInput, TableQueryInput } from '@exyconn/shell/graphql/generated';
import { queryData } from '@exyconn/shell/utils/queryData';

/**
 * The grid fetcher for a Meeting Assistant list. Like `usePagedFetcher`, but the lists take
 * arguments beside the page input — `scope`, and for the checklist `meetingId` — and a screen
 * can pin filters of its own (AI Notes lists only meetings whose summary is ready).
 */
export function useScopedFetcher<TQuery, TRow>(
  document: DocumentNode,
  select: (data: TQuery) => TablePageResult<TRow>,
  variables: Readonly<Record<string, unknown>>,
  presetFilters: readonly TableFilterInput[] = [],
): GridFetcher<TRow> {
  const client = useApolloClient();
  // Written inline at the call site; kept in a ref so the fetcher the grid holds stays stable.
  const latest = useRef({ select, variables, presetFilters });
  latest.current = { select, variables, presetFilters };

  return useMemo(() => {
    const variablesFor = (input: TableQueryInput) => {
      const filters = [...(input.filters ?? []), ...latest.current.presetFilters];
      return { ...latest.current.variables, input: { ...input, filters } };
    };
    const fetchPage = async (input: TableQueryInput): Promise<TablePageResult<TRow>> => {
      const result = await client.query<TQuery>({
        query: document,
        variables: variablesFor(input),
        fetchPolicy: 'network-only',
      });
      const page = latest.current.select(queryData(result, 'The paged list query'));
      return { rows: page.rows, totalCount: page.totalCount };
    };
    return Object.assign(fetchPage, { list: listFieldOf(document), variablesFor });
  }, [client, document]);
}
