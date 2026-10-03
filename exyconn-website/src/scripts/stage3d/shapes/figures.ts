import {
  clampCount,
  fillCloud,
  jitter,
  offset,
  onArc,
  onSegment,
  onSphere,
  tiltX,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * People: `figures` small person glyphs (head and shoulders) on a sphere, each networked to
 * its neighbours. Figure `i` carries tag `i + 1`; the links are tag 0. Pages pass a live
 * count (open roles) — at most 40 figures.
 */
export interface FiguresParams {
  figures?: number;
}

export const FIGURES_BOUNDS: Vec3 = [2, 2, 2];
export const MAX_FIGURES = 40;
const RADIUS = 1.55;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** Figure `index` of `total` spread evenly over the sphere (Fibonacci lattice). */
export const figureAt = (index: number, total: number): Vec3 => {
  const y = total === 1 ? 0 : 1 - (index / (total - 1)) * 2;
  const ring = Math.sqrt(1 - y * y);
  const angle = index * GOLDEN;
  return [RADIUS * ring * Math.cos(angle), RADIUS * y, RADIUS * ring * Math.sin(angle)];
};

const person = (random: Random, at: Vec3): Vec3 => {
  if (random() < 0.4) {
    return onSphere(random, 0.07, offset(at, [0, 0.12, 0]));
  }
  const [x, y, z] = tiltX(onArc(random, 0.13, 0, Math.PI), -Math.PI / 2);
  return offset([x, y - 0.05, z * 0.4], at);
};

export const sampleFigures = (count: number, random: Random, params: FiguresParams = {}): Cloud => {
  const total = clampCount(params.figures ?? 12, 1, MAX_FIGURES);
  const places = Array.from({ length: total }, (_, index) => figureAt(index, total));
  const people: Part[] = places.map((at, index) => ({
    weight: 1,
    tag: index + 1,
    sample: (r) => person(r, at),
  }));
  const links: Part[] = places.slice(1).map((at, index) => ({
    weight: 0.4,
    sample: (r) => jitter(r, onSegment(r, places[index], at), 0.008),
  }));
  return fillCloud(count, [...people, ...links], random);
};
