import { describe, expect, it } from "vitest";
import { clamp, createRandom, damp, lerp, smoothstep, wrap } from "../../src/scripts/home3d/math";

describe("home3d math", () => {
  it("clamps to the unit range by default and to a given range", () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(2)).toBe(1);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("interpolates linearly", () => {
    expect(lerp(2, 4, 0.5)).toBe(3);
  });

  it("eases between two edges", () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });

  it("damps by elapsed time, not by frames", () => {
    const oneStep = damp(0, 1, 4, 1 / 30);
    const twoSteps = damp(damp(0, 1, 4, 1 / 60), 1, 4, 1 / 60);
    expect(oneStep).toBeCloseTo(twoSteps, 10);
    expect(damp(0, 1, 4, 0)).toBe(0);
  });

  it("repeats the same sequence for the same seed and stays in [0, 1)", () => {
    const a = createRandom(7);
    const b = createRandom(7);
    const values = Array.from({ length: 200 }, () => a());
    expect(values).toEqual(Array.from({ length: 200 }, () => b()));
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it("wraps values into a range from either side", () => {
    expect(wrap(5, 0, 4)).toBe(1);
    expect(wrap(-1, 0, 4)).toBe(3);
    expect(wrap(2, 0, 4)).toBe(2);
  });
});
