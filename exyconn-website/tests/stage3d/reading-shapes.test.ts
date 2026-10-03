import { describe, expect, it } from "vitest";
import { createRandom } from "../../src/scripts/stage3d/math";
import { sampleDocuments, sheetOrigin } from "../../src/scripts/stage3d/shapes/documents";
import {
  sampleShield,
  shieldHalfWidth,
  SHIELD_CHECK,
  SHIELD_FACE,
  SHIELD_OUTLINE,
} from "../../src/scripts/stage3d/shapes/shield";
import { leafAt, sampleTree } from "../../src/scripts/stage3d/shapes/tree";

/** The header-band shapes for reading and transactional pages. */
const N = 2000;
const rng = () => createRandom(11);
const tagSet = (tags: Float32Array) => [...new Set(tags)].sort((a, b) => a - b);

describe("shield", () => {
  it("narrows from straight sides to a tip", () => {
    expect(shieldHalfWidth(1)).toBe(1.4);
    expect(shieldHalfWidth(-1.8)).toBeCloseTo(0);
    expect(shieldHalfWidth(-0.6)).toBeGreaterThan(0.5);
    expect(tagSet(sampleShield(N, rng()).tags)).toEqual([
      SHIELD_OUTLINE,
      SHIELD_FACE,
      SHIELD_CHECK,
    ]);
  });
});

describe("documents", () => {
  it("fans the sheets back and tags each one", () => {
    expect(sheetOrigin(0)).toEqual([0, 0, -0]);
    expect(sheetOrigin(2)[2]).toBeCloseTo(-0.56);
    expect(tagSet(sampleDocuments(N, rng()).tags)).toEqual([1, 2, 3, 4]);
    expect(tagSet(sampleDocuments(N, rng(), { sheets: 1 }).tags)).toEqual([1]);
  });
});

describe("tree", () => {
  it("fans each section's pages beneath it", () => {
    expect(leafAt(0, 0, 1, 0.8)).toEqual([0, -1.3, 0]);
    expect(leafAt(1, 0, 3, 0.8)[0]).toBeCloseTo(0.6);
    expect(tagSet(sampleTree(N, rng()).tags)).toEqual([0, 1, 2, 3]);
    expect(tagSet(sampleTree(N, rng(), { branches: [4, 0, 30.2] }).tags)).toEqual([0, 1, 2, 3]);
    expect(tagSet(sampleTree(N, rng(), { branches: Array(20).fill(1) }).tags)).toHaveLength(13);
    expect(() => sampleTree(N, rng(), { branches: [] })).toThrow(/tree/);
  });
});
