import {
  between,
  fillCloud,
  jitter,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * A 2D drawing — a chat bubble, a service mark — as particles: each path is a polyline in a
 * [-1, 1] square (y up), extruded a little in depth. Path `i` carries tag `i + 1`.
 */
export type GlyphPoint = readonly [number, number];
export type GlyphPath = readonly GlyphPoint[];

export interface GlyphParams {
  paths?: readonly GlyphPath[];
  /** Half the extrusion depth. */
  depth?: number;
}

export const GLYPH_SCALE = 1.7;
export const GLYPH_BOUNDS: Vec3 = [1.8, 1.8, 0.5];
const MAX_DEPTH = 0.4;

const unit = (value: number): number => Math.min(1, Math.max(-1, value)) * GLYPH_SCALE;

const segmentLength = (a: GlyphPoint, b: GlyphPoint): number =>
  Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Picks a segment by length, so long strokes get proportionally more points. */
const strokePoint = (random: Random, path: GlyphPath, depth: number): Vec3 => {
  const lengths = path.slice(1).map((point, i) => segmentLength(path[i], point));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let target = random() * total;
  let index = 0;
  while (index < lengths.length - 1 && target > lengths[index]) {
    target -= lengths[index];
    index += 1;
  }
  const t = lengths[index] > 0 ? target / lengths[index] : 0;
  const [ax, ay] = path[index];
  const [bx, by] = path[index + 1];
  return jitter(
    random,
    [unit(ax + (bx - ax) * t), unit(ay + (by - ay) * t), between(random, -depth, depth)],
    0.015
  );
};

export const sampleGlyph = (count: number, random: Random, params: GlyphParams = {}): Cloud => {
  const paths = (params.paths ?? []).filter((path) => path.length >= 2);
  if (paths.length === 0) {
    throw new Error("glyph needs at least one path of two or more points");
  }
  const depth = Math.min(MAX_DEPTH, Math.max(0, params.depth ?? 0.12));
  const parts: Part[] = paths.map((path, index) => ({
    weight: path.slice(1).reduce((sum, point, i) => sum + segmentLength(path[i], point), 0) || 1,
    tag: index + 1,
    sample: (r) => strokePoint(r, path, depth),
  }));
  return fillCloud(count, parts, random);
};
