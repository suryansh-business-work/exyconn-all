import {
  fillCloud,
  inSphere,
  jitter,
  between,
  type Cloud,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Custom model training: the learned shape (a torus, tag 1), the loss curve falling beside
 * it (tag 2) and the stray samples still converging (tag 3).
 */
export type ConvergeParams = Record<string, never>;

export const CONVERGE_BOUNDS: Vec3 = [2.4, 2, 2];
export const CONVERGE_SHAPE = 1;
export const CONVERGE_LOSS = 2;
export const CONVERGE_STRAY = 3;

const torus = (random: Random): Vec3 => {
  const u = random() * Math.PI * 2;
  const v = random() * Math.PI * 2;
  const ring = 0.9 + 0.3 * Math.cos(v);
  return [-0.5 + ring * Math.cos(u), 0.3 * Math.sin(v), ring * Math.sin(u)];
};

const lossCurve = (random: Random): Vec3 => {
  const t = random();
  return jitter(random, [0.7 + t * 1.6, -1.1 + 1.8 * Math.exp(-4 * t), 0.4], 0.012);
};

export const sampleConverge = (count: number, random: Random): Cloud =>
  fillCloud(
    count,
    [
      { weight: 0.6, tag: CONVERGE_SHAPE, sample: torus },
      { weight: 0.2, tag: CONVERGE_LOSS, sample: lossCurve },
      {
        weight: 0.2,
        tag: CONVERGE_STRAY,
        sample: (r) => {
          const [x, y, z] = inSphere(r, 1.9);
          return [Math.max(-2.4, Math.min(2.4, x + between(r, -0.3, 0.3))), y, z];
        },
      },
    ],
    random
  );
