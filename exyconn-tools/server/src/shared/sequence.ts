/**
 * Runs `step` for every item strictly one after another: each step starts only when the
 * previous one has settled, and the first rejection stops the chain.
 *
 * Use it only where order matters (a shared visited-set, ordered results, one request at a
 * time to a crawled host); independent work belongs in `Promise.all`.
 */
export function forEachInSequence<T>(
  items: readonly T[],
  step: (item: T) => Promise<void>,
): Promise<void> {
  return items.reduce<Promise<void>>(
    (previous, item) => previous.then(() => step(item)),
    Promise.resolve(),
  );
}
