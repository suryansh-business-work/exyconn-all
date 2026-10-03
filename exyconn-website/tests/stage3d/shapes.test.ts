import { describe, expect, it } from "vitest";
import { createRandom } from "../../src/scripts/stage3d/math";
import {
  SHAPES,
  SHAPE_IDS,
  isShapeId,
  type ShapeId,
} from "../../src/scripts/stage3d/shapes/registry";
import type { Cloud } from "../../src/scripts/stage3d/shapes/sampling";
import { points } from "../support/points";

/**
 * Every registered shape: the right number of finite points, inside its declared bounds,
 * the same on every run for the same seed, with whole-number tags.
 */
const N = 3000;

/** Data the data-driven shapes need; the rest run on their defaults. */
const DATA: { [K in ShapeId]?: unknown } = {
  globe: {
    arcs: [
      { from: { lat: 28.6, lon: 77.2 }, to: { lat: 51.5, lon: -0.1 } },
      { from: { lat: 40.7, lon: -74 }, to: { lat: -33.9, lon: 151.2 } },
    ],
  },
  glyph: {
    paths: [
      [
        [-1, -1],
        [1, -1],
        [1, 1],
      ],
      [
        [0, 0],
        [0.5, 0.5],
      ],
    ],
  },
  terrain: { values: [3, 9, 4, 12] },
  constellation: {
    groups: [5, 8, 3],
    links: [
      [0, 6],
      [2, 14],
    ],
  },
};

const sample = (id: ShapeId, seed = 5, count = N): Cloud =>
  (SHAPES[id].sample as (n: number, r: () => number, p?: unknown) => Cloud)(
    count,
    createRandom(seed),
    DATA[id]
  );

describe("shape registry", () => {
  it.each(SHAPE_IDS)("%s fills the budget with finite points inside its bounds", (id) => {
    const cloud = sample(id);
    const [bx, by, bz] = SHAPES[id].bounds;
    expect(cloud.positions).toHaveLength(N * 3);
    expect(cloud.tags).toHaveLength(N);
    const outside = points(cloud.positions).filter(
      ([x, y, z]) =>
        !Number.isFinite(x + y + z) || Math.abs(x) > bx || Math.abs(y) > by || Math.abs(z) > bz
    );
    expect(outside).toEqual([]);
    expect([...cloud.tags].every((tag) => Number.isInteger(tag) || tag < 1)).toBe(true);
  });

  it.each(SHAPE_IDS)("%s is deterministic for a seed", (id) => {
    expect(sample(id, 9).positions).toEqual(sample(id, 9).positions);
    expect(sample(id, 9).positions).not.toEqual(sample(id, 10).positions);
  });

  it("knows its ids", () => {
    expect(SHAPE_IDS).toHaveLength(30);
    expect(isShapeId("globe")).toBe(true);
    expect(isShapeId("teapot")).toBe(false);
    expect(isShapeId(3)).toBe(false);
  });
});
