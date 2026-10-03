import { useCallback, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import {
  WhatsappDemoSessionsDocument,
  type TableFilterInput,
  type TableQueryInput,
  type WhatsappDemoSessionsQuery,
  type WhatsappDemoSessionsQueryVariables,
} from '@exyconn/shell/graphql/generated';
import type { TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid.types';
import { queryData } from '@exyconn/shell/utils/queryData';
import type { SessionRow } from './session.columns';

export interface SessionQueryScope {
  from: string;
  to: string;
  /** Filters from outside the grid (industry, status), added to the grid's own. */
  filters: readonly TableFilterInput[];
}

export interface SessionFetcher {
  fetchRows: (input: TableQueryInput) => Promise<TablePageResult<SessionRow>>;
  /** Goes up whenever the scope changes, for the grid's `refreshSignal`. */
  refreshSignal: number;
}

/**
 * The grid's page loader for `whatsappDemoSessions`.
 *
 * Like the shared `usePagedFetcher`, but the query also takes the period, which that hook has
 * no way to pass. The scope lives in a ref and the callback stays stable — the grid builds its
 * datasource from it once — so a scope change is announced through `refreshSignal`, bumped in
 * the same render that saw the new scope (so the reload can never read the old one).
 */
export function useSessionFetcher(scope: SessionQueryScope): SessionFetcher {
  const client = useApolloClient();
  const scopeRef = useRef(scope);
  scopeRef.current = scope;

  const scopeKey = JSON.stringify(scope);
  const [refresh, setRefresh] = useState({ scopeKey, signal: 0 });
  if (refresh.scopeKey !== scopeKey) {
    setRefresh({ scopeKey, signal: refresh.signal + 1 });
  }

  const fetchRows = useCallback(
    async (input: TableQueryInput) => {
      const { from, to, filters } = scopeRef.current;
      const result = await client.query<
        WhatsappDemoSessionsQuery,
        WhatsappDemoSessionsQueryVariables
      >({
        query: WhatsappDemoSessionsDocument,
        variables: {
          input: { ...input, filters: [...(input.filters ?? []), ...filters] },
          from,
          to,
        },
        fetchPolicy: 'network-only',
      });
      const page = queryData(result, 'WhatsappDemoSessions').whatsappDemoSessions;
      return { rows: page.rows, totalCount: page.totalCount };
    },
    [client],
  );
  return { fetchRows, refreshSignal: refresh.signal };
}
