import {
  clampCount,
  fillCloud,
  inSphere,
  jitter,
  onArc,
  tiltX,
  type Cloud,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * A beacon: a bright core (tag 0) emitting `rings` concentric rings facing the camera; ring
 * `i` (innermost first) carries tag `i + 1`, so a form step can pulse the next ring out.
 */
export interface RingsParams {
  rings?: number;
}

export const RINGS_BOUNDS: Vec3 = [2.1, 2.1, 0.3];
const MAX_RINGS = 8;
const INNER = 0.55;
const OUTER = 2;

export const ringRadius = (index: number, total: number): number =>
  total === 1 ? (INNER + OUTER) / 2 : INNER + ((OUTER - INNER) * index) / (total - 1);

export const sampleRings = (count: number, random: Random, params: RingsParams = {}): Cloud => {
  const total = clampCount(params.rings ?? 4, 1, MAX_RINGS);
  return fillCloud(
    count,
    [
      { weight: 0.3 * total, sample: (r) => inSphere(r, 0.25) },
      ...Array.from({ length: total }, (_, index) => ({
        weight: 1,
        tag: index + 1,
        sample: (r: Random): Vec3 =>
          jitter(r, tiltX(onArc(r, ringRadius(index, total), 0, Math.PI * 2), Math.PI / 2), 0.02),
      })),
    ],
    random
  );
};
