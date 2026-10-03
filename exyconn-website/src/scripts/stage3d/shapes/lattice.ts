import {
  clampCount,
  fillCloud,
  onBox,
  pickIndex,
  type Cloud,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Modular blocks assembled into `clusters` stacks — one per service pillar. Every point of
 * cluster `i` carries tag `i + 1`, so hovering a pillar lights its stack.
 */
export interface LatticeParams {
  clusters?: number;
}

export const LATTICE_BOUNDS: Vec3 = [2, 2, 2];
const MAX_CLUSTERS = 8;
const CELL = 0.28;
const RING = 1.35;

export const clusterCentre = (index: number, total: number): Vec3 => {
  if (total === 1) {
    return [0, 0, 0];
  }
  const angle = (index / total) * Math.PI * 2;
  return [RING * Math.sin(angle), 0, RING * Math.cos(angle)];
};

const block = (random: Random, centre: Vec3): Vec3 => {
  const cell: Vec3 = [pickIndex(random, 3) - 1, pickIndex(random, 3) - 1, pickIndex(random, 3) - 1];
  return onBox(
    random,
    [centre[0] + cell[0] * CELL, centre[1] + cell[1] * CELL, centre[2] + cell[2] * CELL],
    [0.2, 0.2, 0.2]
  );
};

export const sampleLattice = (count: number, random: Random, params: LatticeParams = {}): Cloud => {
  const total = clampCount(params.clusters ?? 3, 1, MAX_CLUSTERS);
  return fillCloud(
    count,
    Array.from({ length: total }, (_, index) => {
      const centre = clusterCentre(index, total);
      return { weight: 1, tag: index + 1, sample: (r: Random) => block(r, centre) };
    }),
    random
  );
};
