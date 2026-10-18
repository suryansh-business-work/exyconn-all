import { useCallback, useRef, type RefObject } from 'react';
import type { TypedDocumentNode } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import type { TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid';
import type {
  CrmQueryInput,
  CrmSortInput,
  TableQueryInput,
  TableSortInput,
} from '@exyconn/shell/graphql/generated';
import { queryData } from '@exyconn/shell/utils/queryData';
import { toGroupInputs, type RecordQueryState } from './recordQuery';

/** A generated `SearchLeads`-style document: one CRM query in, one page of records out. */
export type RecordSearchDocument<TQuery> = TypedDocumentNode<TQuery, { query: CrmQueryInput }>;

/**
 * The sorts to ask for, given what the grid's column header says. A header click sorts by that
 * one column; a header that agrees with the first sort level (or shows none) keeps every level
 * the toolbar's Sort control set.
 */
export function sortsAfterHeader(
  header: TableSortInput | null | undefined,
  sorts: CrmSortInput[],
): CrmSortInput[] {
  if (!header) {
    return sorts;
  }
  const primary = sorts[0];
  if (primary?.property === header.field && primary.dir === header.dir) {
    return sorts;
  }
  return [{ property: header.field, dir: header.dir }];
}

/**
 * The `fetchRows` a CrudDashboard takes, sending the list's own query — the filter groups and
 * sorts — instead of the grid's column filters. The search box and the column headers still
 * belong to the grid, so what they ask for is read off each page request and written back into
 * the query through `onChange` (no reload: the grid is already loading that page).
 *
 * It is stable for the page's lifetime, because the grid builds its datasource from it once;
 * the latest query is read from `queryRef` at fetch time.
 */
export function useRecordFetcher<TQuery, TRow>(
  document: RecordSearchDocument<TQuery>,
  select: (data: TQuery) => TablePageResult<TRow>,
  queryRef: RefObject<RecordQueryState>,
  onChange: (query: RecordQueryState) => void,
): (input: TableQueryInput) => Promise<TablePageResult<TRow>> {
  const client = useApolloClient();
  const selectRef = useRef(select);
  selectRef.current = select;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  return useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<TRow>> => {
      const current = queryRef.current;
      const search = input.search ?? '';
      const sorts = sortsAfterHeader(input.sort, current.sorts);
      if (search !== current.search.trim() || sorts !== current.sorts) {
        onChangeRef.current({ ...current, search, sorts });
      }
      const result = await client.query({
        query: document,
        variables: {
          query: {
            page: input.page,
            pageSize: input.pageSize,
            search: search === '' ? null : search,
            groups: toGroupInputs(current.groups),
            sorts,
            // The grid's Archived switch: archived rows only, or (otherwise) none of them.
            archived: input.archived,
          },
        },
        fetchPolicy: 'network-only',
      });
      const page = selectRef.current(queryData(result, 'The CRM records query'));
      return { rows: page.rows, totalCount: page.totalCount };
    },
    [client, document, queryRef],
  );
}
