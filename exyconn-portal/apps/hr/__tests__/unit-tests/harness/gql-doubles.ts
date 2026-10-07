import { vi } from 'vitest';

interface QueryExtras {
  loading?: boolean;
  error?: Error;
  refetch?: ReturnType<typeof vi.fn>;
}

/**
 * What a generated `useXQuery` hook hands a component: the data, the loading and error flags
 * and a refetch that resolves. The screens under test read nothing else from the result.
 */
export function queryResult<T>(data: T | undefined, extras: QueryExtras = {}) {
  return {
    data,
    loading: false,
    error: undefined,
    refetch: vi.fn().mockResolvedValue({ data }),
    ...extras,
  };
}

/** What a generated `useXMutation` hook hands a component: the run function and its state. */
export function mutationTuple(run: ReturnType<typeof vi.fn>, loading = false) {
  return [run, { loading }];
}
