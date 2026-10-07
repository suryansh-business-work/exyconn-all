import { describe, expect, it } from "vitest";
import { createRandom } from "../../../../../src/scripts/stage3d/math";
import { sampleAiChip } from "../../../../../src/scripts/stage3d/shapes/ai-chip";
import { sampleNeuralCore } from "../../../../../src/scripts/stage3d/shapes/neural-core";
import type { Cloud } from "../../../../../src/scripts/stage3d/shapes/sampling";
import { MAX_OPENINGS, sampleWorkforce } from "../../../../../src/scripts/stage3d/shapes/workforce";
import { tagged, tagSet } from "./helpers";

/** The built scenes that take a live count: services, AI categories, open roles. */
const N = 3000;
const rng = () => createRandom(6);
const range = (count: number) => Array.from({ length: count + 1 }, (_, i) => i);
/** How many line vertices carry moving packets. */
const flowing = (cloud: Cloud) => [...(cloud.lines?.flow ?? [])].filter((v) => v === 1).length;

describe("ai chip", () => {
  it("routes one trace and pad per service, nine by default", () => {
    const four = sampleAiChip(N, rng(), { pads: 4 });
    expect(tagSet(four.tags)).toEqual(range(4));
    // Each trace is two legs (out, then the 45° bend) and only traces carry packets.
    expect(flowing(four)).toBe(4 * 2 * 2);
    const standard = sampleAiChip(N, rng());
    expect(tagSet(standard.tags)).toEqual(range(9));
    expect(flowing(standard)).toBe(9 * 4);
    expect(tagSet(sampleAiChip(N, rng(), {}).tags)).toEqual(range(9));
  });

  it("keeps the service count between one and twelve", () => {
    expect(tagSet(sampleAiChip(N, rng(), { pads: 99 }).tags)).toEqual(range(12));
    expect(tagSet(sampleAiChip(N, rng(), { pads: 0 }).tags)).toEqual(range(1));
  });

  it("lays the pads round the board, on the board's surface", () => {
    const cloud = sampleAiChip(N, rng(), { pads: 4 });
    for (const tag of [1, 2, 3, 4]) {
      const route = tagged(cloud.positions, cloud.tags, tag);
      expect(route.every(([, y]) => y >= -0.01 && y <= 0.08)).toBe(true);
    }
  });
});

describe("neural core", () => {
  it("puts one module with its link on the orbits per category, six by default", () => {
    const three = sampleNeuralCore(N, rng(), { modules: 3 });
    expect(tagSet(three.tags)).toEqual(range(3));
    // Every link back into the core is a 20-step arc that carries pulses.
    expect(flowing(three)).toBe(3 * 20 * 2);
    const standard = sampleNeuralCore(N, rng());
    expect(tagSet(standard.tags)).toEqual(range(6));
    expect(flowing(standard)).toBe(6 * 40);
  });

  it("keeps the module count between one and ten", () => {
    expect(tagSet(sampleNeuralCore(N, rng(), { modules: 50 }).tags)).toEqual(range(10));
    expect(tagSet(sampleNeuralCore(N, rng(), { modules: -2 }).tags)).toEqual(range(1));
  });
});

describe("workforce", () => {
  it("leaves one empty seat per opening, three by default, with live reporting lines", () => {
    const five = sampleWorkforce(N, rng(), { openings: 5 });
    expect(tagSet(five.tags)).toEqual(range(5));
    // Each open seat's reporting line has three legs and carries packets.
    expect(flowing(five)).toBe(5 * 3 * 2);
    const standard = sampleWorkforce(N, rng());
    expect(tagSet(standard.tags)).toEqual(range(3));
    expect(flowing(standard)).toBe(3 * 6);
  });

  it("keeps the openings between one and the maximum", () => {
    const many = sampleWorkforce(N, rng(), { openings: 20 });
    expect(tagSet(many.tags)).toEqual(range(MAX_OPENINGS));
    expect(flowing(many)).toBe(MAX_OPENINGS * 6);
    expect(tagSet(sampleWorkforce(N, rng(), { openings: 0 }).tags)).toEqual(range(1));
  });

  it("draws the empty seats on the chart's bottom row", () => {
    const cloud = sampleWorkforce(N, rng(), { openings: 4 });
    for (const tag of [1, 2, 3, 4]) {
      const seat = tagged(cloud.positions, cloud.tags, tag);
      expect(seat.length).toBeGreaterThan(0);
      expect(seat.every(([, y, z]) => Math.abs(y + 0.9) <= 0.091 && z === 0.25)).toBe(true);
    }
  });
});
