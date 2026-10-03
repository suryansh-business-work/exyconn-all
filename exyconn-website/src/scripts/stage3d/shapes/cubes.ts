import { clampCount, fillCloud, onBox, type Cloud, type Random, type Vec3 } from "./sampling";

/**
 * A catalogue: one floating point-cube per item (at most 12), laid out in a grid facing
 * the camera. Cube `i` carries tag `i + 1`, so a category filter can light its tools.
 */
export interface CubesParams {
  cubes?: number;
}

export const CUBES_BOUNDS: Vec3 = [2.2, 1.8, 0.4];
export const MAX_CUBES = 12;
const GAP = 1.1;
const SIZE = 0.6;

export const cubeCentre = (index: number, total: number): Vec3 => {
  const columns = Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  return [(column - (columns - 1) / 2) * GAP, ((rows - 1) / 2 - row) * GAP, 0];
};

export const sampleCubes = (count: number, random: Random, params: CubesParams = {}): Cloud => {
  const total = clampCount(params.cubes ?? 6, 1, MAX_CUBES);
  return fillCloud(
    count,
    Array.from({ length: total }, (_, index) => {
      const centre = cubeCentre(index, total);
      return {
        weight: 1,
        tag: index + 1,
        sample: (r: Random) => onBox(r, centre, [SIZE, SIZE, SIZE]),
      };
    }),
    random
  );
};
