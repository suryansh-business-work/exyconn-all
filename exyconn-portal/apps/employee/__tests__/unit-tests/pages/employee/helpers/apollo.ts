import { vi } from 'vitest';

/** The part of an Apollo query result the My Workspace pages read. */
export interface QueryShape {
  data?: unknown;
  loading?: boolean;
  error?: Error;
  refetch?: () => Promise<unknown>;
}

/**
 * A stand-in for what a generated `use…Query` hook returns. Typed `never` so it fits the
 * return type of whichever hook it is handed to — the pages only read the fields above.
 */
export function queryResult({
  data,
  loading = false,
  error,
  refetch = vi.fn(() => Promise.resolve({})),
}: QueryShape = {}): never {
  return { data, loading, error, refetch } as never;
}

/** A stand-in for a generated `use…Mutation` hook's `[mutate, { loading }]` tuple. */
export function mutationResult(mutate: (...args: never[]) => unknown, loading = false): never {
  return [mutate, { loading }] as never;
}
