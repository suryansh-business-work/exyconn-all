import { useCallback, useEffect, useState } from 'react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmEmailThreadSort,
  useCrmEmailThreadPageQuery,
  useSyncCrmEmailsMutation,
  type CrmTimelineObject,
} from '@exyconn/shell/graphql/generated';
import {
  EMPTY_EMAIL_FILTERS,
  filterInput,
  type EmailThreadFilters,
} from '../forms/email-thread-filters';

export const EMAIL_PAGE_SIZES = [10, 25, 50];

const logFailure = (error: unknown) => portalLogger.warn('crm: reloading emails failed', error);

/**
 * The Emails tab's list: one page of the record's synced threads for the search, sort and
 * filters, after reading the newest mail from Gmail once on open and again on Refresh.
 */
export function useEmailThreadPage(object: CrmTimelineObject, id: string) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(CrmEmailThreadSort.Newest);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(EMAIL_PAGE_SIZES[0]);
  const [filters, setFilters] = useState<EmailThreadFilters>(EMPTY_EMAIL_FILTERS);
  // Worked out when the filters are applied: "last 7 days" must not move on every render.
  const [range, setRange] = useState(() => filterInput(EMPTY_EMAIL_FILTERS, Date.now()));
  const query = useCrmEmailThreadPageQuery({
    variables: { object, id, input: { search: search || null, sort, page, pageSize, ...range } },
    fetchPolicy: 'cache-and-network',
  });
  const [sync, { loading: syncing }] = useSyncCrmEmailsMutation();
  const { refetch } = query;

  const refresh = useCallback(() => {
    sync({ variables: { object, id } })
      .then(() => refetch())
      .catch(logFailure);
  }, [sync, refetch, object, id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    query,
    syncing,
    refresh,
    search,
    sort,
    page,
    pageSize,
    filters,
    changeSearch: (next: string) => {
      setSearch(next);
      setPage(0);
    },
    changeSort: (next: CrmEmailThreadSort) => {
      setSort(next);
      setPage(0);
    },
    changePageSize: (next: number) => {
      setPageSize(next);
      setPage(0);
    },
    setPage,
    applyFilters: (next: EmailThreadFilters) => {
      setFilters(next);
      setRange(filterInput(next, Date.now()));
      setPage(0);
    },
  };
}
