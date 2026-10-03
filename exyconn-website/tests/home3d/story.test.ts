import { describe, expect, it } from "vitest";
import { poseAt } from "../../src/scripts/home3d/camera-path";
import {
  activeChapter,
  blueprintAmount,
  hudOpacity,
  LAST_CHAPTER,
  shapeWeights,
  storyPosition,
} from "../../src/scripts/home3d/story";

const anchors = [0, 1000, 2000, 3000, 4000];

describe("storyPosition", () => {
  it("is 0 with no anchors and before the first", () => {
    expect(storyPosition([], 500, 100)).toBe(0);
    expect(storyPosition(anchors, -10, 100)).toBe(0);
  });

  it("holds a chapter while it is read and morphs only in the blend window", () => {
    expect(storyPosition(anchors, 500, 200)).toBe(0);
    expect(storyPosition(anchors, 900, 200)).toBe(0.5);
    expect(storyPosition(anchors, 1500, 200)).toBe(1);
  });

  it("ends on the last chapter", () => {
    expect(storyPosition(anchors, 9000, 200)).toBe(4);
  });
});

describe("shapeWeights", () => {
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

  it("shows only the core at the start and at the end", () => {
    expect(shapeWeights(0)).toEqual([1, 0, 0, 0]);
    expect(shapeWeights(LAST_CHAPTER)).toEqual([1, 0, 0, 0]);
  });

  it("splits weight between neighbouring chapters and always sums to 1", () => {
    expect(shapeWeights(1.25)).toEqual([0, 0.75, 0.25, 0]);
    expect(shapeWeights(3.5)).toEqual([0.5, 0, 0, 0.5]);
    for (let s = -1; s <= 5; s += 0.1) {
      expect(sum(shapeWeights(s))).toBeCloseTo(1, 10);
    }
  });
});

describe("chapter helpers", () => {
  it("names the dominant chapter", () => {
    expect(activeChapter(1.4)).toBe(1);
    expect(activeChapter(1.6)).toBe(2);
    expect(activeChapter(9)).toBe(LAST_CHAPTER);
  });

  it("dissolves the blueprint over the first span of scroll", () => {
    expect(blueprintAmount(0, 600)).toBe(1);
    expect(blueprintAmount(300, 600)).toBe(0.5);
    expect(blueprintAmount(900, 600)).toBe(0);
  });

  it("brings the construction lines back faintly for the closing chapter", () => {
    expect(hudOpacity(1, 0)).toBe(1);
    expect(hudOpacity(0, 2)).toBe(0);
    expect(hudOpacity(0, LAST_CHAPTER)).toBeCloseTo(0.45);
  });
});

describe("poseAt", () => {
  it("returns each chapter's pose exactly on the chapter", () => {
    expect(poseAt(0, false).offset).toEqual([1.9, 0]);
    expect(poseAt(LAST_CHAPTER, false).offset).toEqual([0, 0.55]);
  });

  it("centres the subject on compact screens", () => {
    for (let s = 0; s <= LAST_CHAPTER; s += 0.25) {
      expect(poseAt(s, true).offset[0]).toBe(0);
    }
  });

  it("interpolates between chapters", () => {
    const pose = poseAt(0.5, false);
    expect(pose.camera[0]).toBeCloseTo(-0.3);
    expect(pose.yaw).toBeCloseTo(-1.175);
    expect(pose.scale).toBeCloseTo(0.8);
    expect(pose.pitch).toBeCloseTo(0.21);
  });
});
