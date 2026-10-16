import { useEffect } from 'react';
import { useTableInfoQuery } from '@/graphql/generated';
import { portalLogger } from '@/logging/portalLogger';
import type { TableInfo } from './tableColumns';

/**
 * What the server lets a grid filter, sort and import for its paged list, or null while it
 * loads — and for a grid whose fetcher names no list (one built on its own query input),
 * which keeps the filters and sorts its column factories gave it.
 */
export function useTableInfo(list: string | undefined): TableInfo | null {
  const { data, error } = useTableInfoQuery({
    variables: { list: list ?? '' },
    skip: !list,
    fetchPolicy: 'cache-first',
  });
  useEffect(() => {
    if (error) {
      portalLogger.error('Could not load what the grid may filter and sort', error, { list });
    }
  }, [error, list]);
  return data?.tableInfo ?? null;
}
