/**
 * Runs `step` for every item strictly one after another: each step starts only when the
 * previous one has settled, and the first rejection stops the chain.
 *
 * Use it only where order matters (output page order, progress per item, memory-heavy
 * canvas work, one OCR worker); independent work belongs in `Promise.all`.
 */
export function forEachInSequence<T>(
  items: readonly T[],
  step: (item: T, index: number) => Promise<void>
): Promise<void> {
  return items.reduce<Promise<void>>(
    (previous, item, index) => previous.then(() => step(item, index)),
    Promise.resolve()
  );
}

/** The page numbers of a document with `count` pages: 1, 2, …, count. */
export const pageNumbers = (count: number): number[] => Array.from({ length: count }, (_, index) => index + 1);
