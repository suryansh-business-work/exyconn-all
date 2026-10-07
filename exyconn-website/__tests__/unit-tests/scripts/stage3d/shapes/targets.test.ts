import { describe, expect, it } from "vitest";
import { createRandom } from "../../../../../src/scripts/stage3d/math";
import { SHAPES } from "../../../../../src/scripts/stage3d/shapes/registry";
import { buildTargets, DEFAULT_SEED } from "../../../../../src/scripts/stage3d/shapes/targets";

/** The hero shape (the first a page names) decides the build order and the drawn structure. */
describe("buildTargets hero shape", () => {
  it("builds in the hero's story order and draws the hero's structure", () => {
    const targets = buildTargets(["city", "globe"], 400);
    const city = SHAPES.city.sample(400, createRandom(DEFAULT_SEED));
    expect(targets.count).toBe(400);
    expect(targets.order).toEqual(city.order);
    expect(targets.order).not.toBe(targets.random);
    expect(targets.lines).not.toBeNull();
    expect(targets.lines?.positions).toEqual(city.lines?.positions);
    expect(targets.lines?.flow).toEqual(city.lines?.flow);
  });

  it("falls back to the random stagger and no structure for a shape without a story", () => {
    const targets = buildTargets(["lattice", "city"], 400);
    expect(targets.order).toBe(targets.random);
    expect(targets.lines).toBeNull();
    expect(targets.positions[1]).toHaveLength(1200);
  });

  it("passes each data-driven shape its own data", () => {
    const targets = buildTargets(["aiChip", "neuralCore"], 2000, {
      aiChip: { pads: 2 },
      neuralCore: { modules: 4 },
    });
    expect(new Set(targets.tags[0])).toEqual(new Set([0, 1, 2]));
    expect(new Set(targets.tags[1])).toEqual(new Set([0, 1, 2, 3, 4]));
  });
});
