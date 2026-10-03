import {
  between,
  fillCloud,
  jitter,
  onSegment,
  type Cloud,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Legal and policy pages: a shield. Its outline (tag 1), a lattice of points filling the face
 * (tag 2) and a check mark across it (tag 3).
 */
export type ShieldParams = Record<string, never>;

export const SHIELD_BOUNDS: Vec3 = [1.6, 1.9, 0.4];
export const SHIELD_OUTLINE = 1;
export const SHIELD_FACE = 2;
export const SHIELD_CHECK = 3;
const TOP = 1.5;
const SHOULDER = 0.6;
const TIP = -1.8;

/** Half-width of the shield at height `y`: straight sides, then a curve to the tip. */
export const shieldHalfWidth = (y: number): number => {
  if (y >= SHOULDER) {
    return 1.4;
  }
  const t = (SHOULDER - y) / (SHOULDER - TIP);
  return 1.4 * Math.cos((t * Math.PI) / 2);
};

const outline = (random: Random): Vec3 => {
  if (random() < 0.2) {
    return jitter(random, [between(random, -1.4, 1.4), TOP, 0], 0.01);
  }
  const y = between(random, TIP, TOP);
  const side = random() < 0.5 ? -1 : 1;
  return jitter(random, [side * shieldHalfWidth(y), y, 0], 0.01);
};

const face = (random: Random): Vec3 => {
  const y = between(random, TIP + 0.1, TOP - 0.05);
  const half = shieldHalfWidth(y) * 0.92;
  const x = Math.round(between(random, -half, half) / 0.16) * 0.16;
  return [Math.max(-half, Math.min(half, x)), y, between(random, -0.06, 0.06)];
};

const check = (random: Random): Vec3 =>
  random() < 0.35
    ? onSegment(random, [-0.55, 0, 0.2], [-0.15, -0.45, 0.2])
    : onSegment(random, [-0.15, -0.45, 0.2], [0.7, 0.55, 0.2]);

export const sampleShield = (count: number, random: Random): Cloud =>
  fillCloud(
    count,
    [
      { weight: 0.35, tag: SHIELD_OUTLINE, sample: outline },
      { weight: 0.45, tag: SHIELD_FACE, sample: face },
      { weight: 0.2, tag: SHIELD_CHECK, sample: check },
    ],
    random
  );
