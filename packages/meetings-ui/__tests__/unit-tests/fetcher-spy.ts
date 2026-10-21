/** The page selectors screens hand `useScopedFetcher`, newest last. */
export const selectors: Array<(data: unknown) => unknown> = [];

/**
 * Wraps the real `useScopedFetcher` so a test can check which field of the answer a screen
 * reads its page from. Use as `vi.mock('<path>/lib/useScopedFetcher', spyOnFetcher)`.
 */
export async function spyOnFetcher(importOriginal: () => Promise<unknown>) {
  const real = (await importOriginal()) as typeof import('../../src/lib/useScopedFetcher');
  return {
    useScopedFetcher: (...args: Parameters<typeof real.useScopedFetcher>) => {
      selectors.push(args[1] as (data: unknown) => unknown);
      return real.useScopedFetcher(...args);
    },
  };
}

/** Asserts the newest selector reads its page from `field`. */
export function readsPageFrom(field: string): boolean {
  const page = { rows: [], totalCount: 0 };
  return selectors.at(-1)?.({ [field]: page }) === page;
}
