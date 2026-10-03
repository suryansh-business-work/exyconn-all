import { neon } from '../theme/tokens';

/** Neon colours the scenes paint with, weighted toward violet like the site hero. */
export const SCENE_COLORS: readonly string[] = [
  neon.violet,
  neon.violet,
  neon.fuchsia,
  neon.cyan,
  neon.cyan,
  neon.orange,
];

/** Deterministic pseudo-random sequence so a scene looks the same on every load. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
