/**
 * A small in-memory cache for the CMS reads: every page render asks for its site and page,
 * and the portal need not answer the same question more than once every few seconds. Entries
 * expire after `ttlMs`; past `maxEntries` the oldest entry is dropped, so a crawler walking
 * thousands of URLs cannot grow it without bound.
 */
export interface TtlCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
}

export function createTtlCache<T>(ttlMs: number, maxEntries: number): TtlCache<T> {
  const entries = new Map<string, { value: T; expires: number }>();
  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) {
        return undefined;
      }
      if (entry.expires <= Date.now()) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, { value, expires: Date.now() + ttlMs });
      if (entries.size > maxEntries) {
        const oldest = entries.keys().next().value;
        if (oldest !== undefined) {
          entries.delete(oldest);
        }
      }
    },
  };
}

/** Reads through a cache: the cached value while fresh, else `load()` (and remembers it). */
export async function cached<T>(
  cache: TtlCache<T>,
  key: string,
  load: () => Promise<T>
): Promise<T> {
  const hit = cache.get(key);
  if (hit !== undefined) {
    return hit;
  }
  const value = await load();
  cache.set(key, value);
  return value;
}
