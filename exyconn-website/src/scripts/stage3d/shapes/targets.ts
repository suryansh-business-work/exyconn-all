import { createRandom } from "../math";
import { SHAPES, type ShapeId, type ShapeParamsMap } from "./registry";
import type { LineSet } from "./sampling";

/**
 * The point targets one stage morphs between: the shapes a page asked for, sampled once
 * at the tier's budget. Every point keeps the same index in every shape, so the shader can
 * morph by blending positions. Shape `n`'s per-point tags live in `tags[n]`.
 */
export const MAX_STAGE_SHAPES = 3;
export const DEFAULT_SEED = 20261003;

export type ShapeData = { readonly [K in ShapeId]?: ShapeParamsMap[K] };

export interface StageTargets {
  count: number;
  positions: Float32Array[];
  tags: Float32Array[];
  /** One stable random per point: stagger, size, colour. */
  random: Float32Array;
  /** When each point is built in the hero shape (0 first, 1 last). */
  order: Float32Array;
  /** The hero shape's structure, when it draws one. */
  lines: LineSet | null;
}

const sampleOne = <K extends ShapeId>(
  id: K,
  count: number,
  random: () => number,
  data: ShapeData
) => SHAPES[id].sample(count, random, data[id]);

export const buildTargets = (
  shapeIds: readonly ShapeId[],
  count: number,
  data: ShapeData = {},
  seed = DEFAULT_SEED
): StageTargets => {
  if (shapeIds.length === 0 || shapeIds.length > MAX_STAGE_SHAPES) {
    throw new Error(`a stage shows 1 to ${MAX_STAGE_SHAPES} shapes, got ${shapeIds.length}`);
  }
  const random = createRandom(seed);
  const clouds = shapeIds.map((id) => sampleOne(id, count, random, data));
  const stagger = Float32Array.from({ length: count }, () => random());
  return {
    count,
    positions: clouds.map((cloud) => cloud.positions),
    tags: clouds.map((cloud) => cloud.tags),
    random: stagger,
    // A shape without a story builds in the random stagger it always had.
    order: clouds[0].order ?? stagger,
    lines: clouds[0].lines ?? null,
  };
};
