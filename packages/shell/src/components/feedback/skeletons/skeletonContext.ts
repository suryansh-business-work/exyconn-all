import { createContext } from 'react';

/** What a placeholder bone does while it waits: pulse, or — under reduced motion — nothing. */
export type BoneAnimation = 'pulse' | false;

interface SkeletonScope {
  animation: BoneAnimation;
  /** True inside a `SkeletonStatus`, so a nested skeleton does not announce itself twice. */
  inStatus: boolean;
}

/** Outside any skeleton a bone behaves like MUI's own `Skeleton`: it pulses. */
export const SkeletonContext = createContext<SkeletonScope>({
  animation: 'pulse',
  inStatus: false,
});

/**
 * Stable keys for `count` placeholders — there is no data yet to key them by, and an array
 * index is not a key. `skeletonKeys(3, 'row')` → `['row-1', 'row-2', 'row-3']`.
 */
export function skeletonKeys(count: number, prefix: string): string[] {
  return Array.from({ length: Math.max(count, 0) }, (_, n) => `${prefix}-${n + 1}`);
}
