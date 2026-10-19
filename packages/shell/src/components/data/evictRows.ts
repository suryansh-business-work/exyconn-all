import type { ApolloCache, StoreObject } from '@apollo/client';

/**
 * Drops deleted records from the Apollo cache, so every list holding them re-renders without
 * them and nothing has to be refetched (Apollo leaves dangling references out of lists). A
 * row that carries no `__typename` has no cache id and is left alone: evicting `undefined`
 * would drop the whole root query.
 */
export function evictRows(cache: ApolloCache, rows: readonly object[]): void {
  for (const row of rows) {
    const id = cache.identify(row as StoreObject);
    if (id) {
      cache.evict({ id });
    }
  }
  cache.gc();
}
