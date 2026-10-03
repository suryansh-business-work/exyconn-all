import {
  between,
  clampCount,
  fillCloud,
  onBox,
  pickIndex,
  type Cloud,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Reading pages: `sheets` stacked pages fanned slightly, each a faint page face with
 * ruled text lines. Sheet `i` (front first) carries tag `i + 1`, so a TOC entry can light its page.
 */
export interface DocumentsParams {
  sheets?: number;
}

export const DOCUMENTS_BOUNDS: Vec3 = [1.9, 1.9, 1.2];
const MAX_SHEETS = 8;
const WIDTH = 1.9;
const HEIGHT = 2.5;
const LINES = 9;

/** Where sheet `index` sits: each one further back, up and to the right. */
export const sheetOrigin = (index: number): Vec3 => [index * 0.18, index * 0.14, -index * 0.28];

const sheet = (random: Random, origin: Vec3): Vec3 => {
  if (random() < 0.3) {
    return onBox(random, origin, [WIDTH, HEIGHT, 0]);
  }
  const line = pickIndex(random, LINES);
  const y = HEIGHT / 2 - 0.35 - line * 0.22;
  const length = line % 3 === 2 ? 0.55 : 0.85;
  return [
    origin[0] + between(random, -WIDTH * 0.38, WIDTH * length * 0.5),
    origin[1] + y,
    origin[2],
  ];
};

export const sampleDocuments = (
  count: number,
  random: Random,
  params: DocumentsParams = {}
): Cloud => {
  const total = clampCount(params.sheets ?? 4, 1, MAX_SHEETS);
  const centre = (total - 1) / 2;
  return fillCloud(
    count,
    Array.from({ length: total }, (_, index) => {
      const [x, y, z] = sheetOrigin(index - centre);
      return {
        weight: index === 0 ? 2 : 1,
        tag: index + 1,
        sample: (r: Random) => sheet(r, [x, y, z]),
      };
    }),
    random
  );
};
