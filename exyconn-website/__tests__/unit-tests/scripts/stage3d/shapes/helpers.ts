import type { Random, Vec3 } from "../../../../../src/scripts/stage3d/shapes/sampling";

/** A flat xyz buffer as a list of points. */
export const points = (positions: Float32Array): Vec3[] =>
  Array.from({ length: positions.length / 3 }, (_, i) => [
    positions[i * 3],
    positions[i * 3 + 1],
    positions[i * 3 + 2],
  ]);

/** The distinct tags of a cloud, ascending. */
export const tagSet = (tags: Float32Array): number[] => [...new Set(tags)].sort((a, b) => a - b);

/** The points of a cloud that carry `tag`. */
export const tagged = (positions: Float32Array, tags: Float32Array, tag: number): Vec3[] =>
  points(positions).filter((_, i) => tags[i] === tag);

/** A scripted random source: the values in turn, then the last one forever. */
export const sequence = (...values: number[]): Random => {
  let index = 0;
  return () => {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value;
  };
};

/** Wraps a random source and counts how many numbers were drawn from it. */
export const counting = (random: Random): { random: Random; calls: () => number } => {
  let calls = 0;
  return {
    random: () => {
      calls += 1;
      return random();
    },
    calls: () => calls,
  };
};
