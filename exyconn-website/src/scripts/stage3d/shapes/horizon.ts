import { between, fillCloud, onRing, type Cloud, type Random, type Vec3 } from "./sampling";

/**
 * A rippling ground plane and a sun rising over it in `horizons` arcs — now, next, later.
 * Arc `i` carries tag `i + 1`; the plane and the sun's disc are tag 0.
 */
export interface HorizonParams {
  horizons?: number;
}

export const HORIZON_BOUNDS: Vec3 = [2.4, 1.6, 2.4];
const GROUND_Y = -0.9;
const SUN_RADIUS = 1.6;
const SUN_Z = -1.4;

const ground = (random: Random): Vec3 => {
  const x = between(random, -2.4, 2.4);
  const z = between(random, -2.4, 0.8);
  return [x, GROUND_Y + 0.08 * Math.sin(x * 2.2) * Math.cos(z * 1.7), z];
};

/** Arc `index` of `total` across the upper half circle of the sun. */
const sunArc = (random: Random, index: number, total: number): Vec3 => {
  const angle = Math.PI * ((index + random()) / total);
  return [SUN_RADIUS * Math.cos(angle), GROUND_Y + SUN_RADIUS * Math.sin(angle) * 0.9, SUN_Z];
};

const sunDisc = (random: Random): Vec3 => {
  const [x, , z] = onRing(random, 0, 0.45);
  return [x, GROUND_Y + 0.35 + z * 0.6, SUN_Z];
};

export const sampleHorizon = (count: number, random: Random, params: HorizonParams = {}): Cloud => {
  const total = Math.max(1, Math.round(params.horizons ?? 3));
  return fillCloud(
    count,
    [
      { weight: 0.55, sample: ground },
      { weight: 0.1, sample: sunDisc },
      ...Array.from({ length: total }, (_, index) => ({
        weight: 0.35 / total,
        tag: index + 1,
        sample: (r: Random) => sunArc(r, index, total),
      })),
    ],
    random
  );
};
