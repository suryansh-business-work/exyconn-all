import type { Vec3 } from "../../src/scripts/stage3d/shapes/sampling";

/** A flat xyz buffer as a list of points. */
export const points = (positions: Float32Array): Vec3[] =>
  Array.from({ length: positions.length / 3 }, (_, i) => [
    positions[i * 3],
    positions[i * 3 + 1],
    positions[i * 3 + 2],
  ]);
