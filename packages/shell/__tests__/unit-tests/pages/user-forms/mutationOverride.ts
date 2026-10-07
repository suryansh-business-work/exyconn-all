/**
 * Lets a test replace one generated mutation's `mutate` with its own function, to reach the
 * path where it rejects with something that is not an Error — which Apollo itself never does.
 * Every other call goes to the real hook and the MockedProvider behind it.
 */
export interface MutationOverride {
  mutate: ((...args: unknown[]) => Promise<unknown>) | null;
}

export function withOverride<A extends unknown[], T extends readonly unknown[]>(
  override: MutationOverride,
  hook: (...args: A) => T,
) {
  return (...args: A): T => {
    const tuple = hook(...args);
    return override.mutate ? ([override.mutate, ...tuple.slice(1)] as unknown as T) : tuple;
  };
}
