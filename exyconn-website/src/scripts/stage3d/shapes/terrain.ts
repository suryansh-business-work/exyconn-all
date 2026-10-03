import { between, fillCloud, onBox, spread, type Cloud, type Random, type Vec3 } from "./sampling";

/**
 * Proof as landscape: one bar per value (at most 16), heights scaled to the largest, rising
 * from a dotted floor (tag 0). Bar `i` carries tag `i + 1`. Pages pass real metrics.
 */
export interface TerrainParams {
  values?: readonly number[];
}

export const TERRAIN_BOUNDS: Vec3 = [2.4, 1.6, 1.2];
export const MAX_BARS = 16;
const FLOOR_Y = -1.2;
const MIN_HEIGHT = 0.2;
const MAX_HEIGHT = 2.6;

/** Bar heights for `values`: negatives count as 0, the largest reaches MAX_HEIGHT. */
export const barHeights = (values: readonly number[]): number[] => {
  const clean = values.slice(0, MAX_BARS).map((value) => Math.max(0, value));
  const top = Math.max(...clean);
  return clean.map((value) =>
    top > 0 ? MIN_HEIGHT + (value / top) * (MAX_HEIGHT - MIN_HEIGHT) : MIN_HEIGHT
  );
};

export const sampleTerrain = (count: number, random: Random, params: TerrainParams = {}): Cloud => {
  const heights = barHeights(params.values ?? []);
  if (heights.length === 0) {
    throw new Error("terrain needs at least one value");
  }
  const xs = spread(heights.length, -2, 2);
  const width = Math.min(0.5, 3.2 / heights.length);
  return fillCloud(
    count,
    [
      {
        weight: 0.25,
        sample: (r) => [between(r, -2.4, 2.4), FLOOR_Y, between(r, -1.2, 1.2)],
      },
      ...heights.map((height, index) => ({
        weight: (0.75 * height) / MAX_HEIGHT,
        tag: index + 1,
        sample: (r: Random) =>
          onBox(r, [xs[index], FLOOR_Y + height / 2, 0], [width, height, width]),
      })),
    ],
    random
  );
};
