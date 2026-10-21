/**
 * Runs `work` over `items` one at a time, in order, and resolves with every result in the
 * same order. Each call starts only after the previous one has settled, so a later step can
 * rely on an earlier one's writes (ordered writes, migrations, unique indexes, rate-limited
 * APIs). The first rejection stops the chain and rejects the returned promise.
 *
 * Use `Promise.all` instead when the iterations are independent.
 */
export function inSequence<T, R>(
  items: readonly T[],
  work: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  return items.reduce<Promise<R[]>>(
    (chain, item, index) =>
      chain.then((results) => work(item, index).then((result) => [...results, result])),
    Promise.resolve([]),
  );
}
