import { describe, expect, it } from "vitest";
import { buildTargets, MAX_STAGE_SHAPES } from "../../src/scripts/stage3d/shapes/targets";

describe("buildTargets", () => {
  it("samples only the shapes a page asks for, at one budget", () => {
    const targets = buildTargets(["lattice", "cubes"], 500, { cubes: { cubes: 4 } });
    expect(targets.positions).toHaveLength(2);
    expect(targets.tags).toHaveLength(2);
    expect(targets.positions[1]).toHaveLength(1500);
    expect(new Set(targets.tags[1]).size).toBe(4);
    expect(targets.random).toHaveLength(500);
    expect([...targets.random].every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it("is deterministic per seed", () => {
    expect(buildTargets(["globe"], 300).positions[0]).toEqual(
      buildTargets(["globe"], 300).positions[0]
    );
    expect(buildTargets(["globe"], 300, {}, 1).positions[0]).not.toEqual(
      buildTargets(["globe"], 300, {}, 2).positions[0]
    );
  });

  it("takes one to three shapes", () => {
    expect(() => buildTargets([], 100)).toThrow(/1 to 3/);
    expect(() => buildTargets(["core", "rings", "cubes", "layers"], 100)).toThrow(/got 4/);
    expect(MAX_STAGE_SHAPES).toBe(3);
  });
});
