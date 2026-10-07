import { describe, expect, it } from "vitest";
import { createRandom } from "../../../../../src/scripts/stage3d/math";
import {
  SHAPE_IDS,
  SHAPES,
  type ShapeId,
} from "../../../../../src/scripts/stage3d/shapes/registry";
import type { Cloud, Random } from "../../../../../src/scripts/stage3d/shapes/sampling";
import { points } from "./helpers";

/**
 * The built scenes: each one is told as a story (a build order per point) and draws its
 * structure as lines, and the stage looks down on it a little.
 */
const BUILT: readonly ShapeId[] = [
  "aiChip",
  "city",
  "cloudStack",
  "dataflow",
  "devices",
  "integration",
  "modernize",
  "neuralCore",
  "ops",
  "roadmap",
  "workforce",
];
const N = 1500;
const MOTIONS: ReadonlySet<string> = new Set(["spin", "sway"]);

const sample = (id: ShapeId): Cloud =>
  (SHAPES[id].sample as (n: number, r: Random) => Cloud)(N, createRandom(8));

const present = <T>(value: T | undefined): T => {
  expect(value).toBeDefined();
  if (value === undefined) {
    throw new Error("expected a value");
  }
  return value;
};

const inUnit = (values: Float32Array) => [...values].every((value) => value >= 0 && value <= 1);

describe("built scenes", () => {
  it.each(BUILT)("%s gives every point a build order between 0 and 1", (id) => {
    const order = present(sample(id).order);
    expect(order).toHaveLength(N);
    expect(inUnit(order)).toBe(true);
    // A story, not one moment: the build spreads over time.
    expect(Math.max(...order) - Math.min(...order)).toBeGreaterThan(0.5);
  });

  it.each(BUILT)("%s draws its structure inside its bounds, with live data links", (id) => {
    const lines = present(sample(id).lines);
    const vertices = lines.order.length;
    expect(vertices).toBeGreaterThan(0);
    expect(vertices % 2).toBe(0);
    expect(lines.positions).toHaveLength(vertices * 3);
    expect(lines.flow).toHaveLength(vertices);
    expect(lines.along).toHaveLength(vertices);
    expect(inUnit(lines.order)).toBe(true);
    expect(inUnit(lines.along)).toBe(true);
    expect([...lines.flow].every((value) => value === 0 || value === 1)).toBe(true);
    expect([...lines.flow].some((value) => value === 1)).toBe(true);
    const [bx, by, bz] = SHAPES[id].bounds;
    const outside = points(lines.positions).filter(
      ([x, y, z]) => Math.abs(x) > bx + 1e-5 || Math.abs(y) > by + 1e-5 || Math.abs(z) > bz + 1e-5
    );
    expect(outside).toEqual([]);
  });

  it("looks down only on the built scenes", () => {
    const pitched = SHAPE_IDS.filter((id) => SHAPES[id].pitch !== undefined);
    expect(pitched.toSorted((a, b) => a.localeCompare(b))).toEqual(BUILT);
    expect(BUILT.every((id) => (SHAPES[id].pitch ?? 0) > 0)).toBe(true);
  });

  it("spins volumes and sways flat layouts", () => {
    expect(SHAPES.globe.motion).toBe("spin");
    expect(SHAPES.city.motion).toBe("spin");
    expect(SHAPES.devices.motion).toBe("sway");
    expect(SHAPE_IDS.every((id) => MOTIONS.has(SHAPES[id].motion))).toBe(true);
  });
});
