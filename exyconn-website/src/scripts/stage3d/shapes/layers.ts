import {
  between,
  clampCount,
  fillCloud,
  jitter,
  onSegment,
  pickIndex,
  spread,
  type Cloud,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Models: `layers` stacked planes of points (plane `i` carries tag `i + 1`) with sparse
 * links between neighbouring planes (tag 0).
 */
export interface LayersParams {
  layers?: number;
}

export const LAYERS_BOUNDS: Vec3 = [1.3, 1.4, 1.3];
const HALF = 1.1;
const GRID = 6;
const MAX_LAYERS = 8;

const node = (random: Random, y: number): Vec3 => [
  -HALF + (pickIndex(random, GRID) / (GRID - 1)) * HALF * 2,
  y,
  -HALF + (pickIndex(random, GRID) / (GRID - 1)) * HALF * 2,
];

const plane = (random: Random, y: number): Vec3 =>
  jitter(random, [between(random, -HALF, HALF), y, between(random, -HALF, HALF)], 0.01);

export const sampleLayers = (count: number, random: Random, params: LayersParams = {}): Cloud => {
  const total = clampCount(params.layers ?? 5, 1, MAX_LAYERS);
  const heights = spread(total, -1.2, 1.2);
  return fillCloud(
    count,
    [
      ...heights.map((y, index) => ({
        weight: 0.8 / total,
        tag: index + 1,
        sample: (r: Random) => plane(r, y),
      })),
      {
        weight: 0.2,
        sample: (r: Random) => {
          const from = pickIndex(r, Math.max(1, total - 1));
          const to = Math.min(total - 1, from + 1);
          return onSegment(r, node(r, heights[from]), node(r, heights[to]));
        },
      },
    ],
    random
  );
};
