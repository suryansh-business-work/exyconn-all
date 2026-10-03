import { clamp, smoothstep } from "./math";

/**
 * The scroll story. The page is split into chapters; each chapter "arrives" at a scroll
 * offset (its anchor). Between two anchors the protagonist holds its shape while the
 * chapter is read and morphs only in the last `blend` pixels before the next one.
 *
 * The story position is a float: 2 means "chapter 2, fully formed", 2.5 "halfway into 3".
 */

/** The four point clouds the protagonist can take. */
export const SHAPES = ["core", "jet", "robot", "planet"] as const;
export type ShapeName = (typeof SHAPES)[number];

/** Which cloud each chapter shows: hero core, aviation, robotics, space, core again. */
export const CHAPTER_SHAPES: readonly number[] = [0, 1, 2, 3, 0];

export const LAST_CHAPTER = CHAPTER_SHAPES.length - 1;

export const storyPosition = (anchors: readonly number[], y: number, blend: number): number => {
  if (anchors.length === 0 || y <= anchors[0]) {
    return 0;
  }
  for (let index = 0; index < anchors.length - 1; index += 1) {
    const next = anchors[index + 1];
    if (y < next) {
      return index + smoothstep(next - blend, next, y);
    }
  }
  return anchors.length - 1;
};

/** The weight of each cloud (summing to 1) at a story position. */
export const shapeWeights = (story: number): number[] => {
  const position = clamp(story, 0, LAST_CHAPTER);
  const from = Math.min(Math.floor(position), LAST_CHAPTER - 1);
  const progress = position - from;
  const weights = SHAPES.map(() => 0);
  weights[CHAPTER_SHAPES[from]] += 1 - progress;
  weights[CHAPTER_SHAPES[from + 1]] += progress;
  return weights;
};

/** The chapter whose shape dominates — used for the progress rail and still frames. */
export const activeChapter = (story: number): number => Math.round(clamp(story, 0, LAST_CHAPTER));

/**
 * The hero opens as a blueprint and materialises over the first `span` pixels of scroll.
 * The construction lines come back faintly around the core in the closing chapter.
 */
export const blueprintAmount = (scrollY: number, span: number): number =>
  1 - smoothstep(0, span, scrollY);

export const hudOpacity = (blueprint: number, story: number): number =>
  Math.max(blueprint, smoothstep(LAST_CHAPTER - 0.6, LAST_CHAPTER, story) * 0.45);
