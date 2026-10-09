import { arcPoints, createLines } from "./lines";
import {
  between,
  fillCloud,
  jitter,
  onBox,
  pickIndex,
  type Cloud,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Application modernization: a monolith becomes services. On the left the legacy system is
 * one heavy block with a grid of tightly coupled modules; its pieces stream across to the
 * right, where they settle as a mesh of small, separate service containers wired to one
 * another. Built monolith first, then the stream, the services, and the mesh last. The
 * monolith carries tag 1, the services 2.
 */
export const MODERNIZE_BOUNDS: Vec3 = [2.45, 1.35, 1];

const MONOLITH: Vec3 = [-1.65, -0.05, 0];
const MONOLITH_SIZE: Vec3 = [1, 2.2, 0.8];
const SERVICE = 0.32;
/** A 3 × 3 grid of services, staggered in depth. */
const SERVICES: readonly Vec3[] = Array.from({ length: 9 }, (_, i): Vec3 => [
  0.85 + (i % 3) * 0.7,
  0.75 - Math.floor(i / 3) * 0.75,
  ((i * 7) % 3) * 0.3 - 0.3,
]);
const MESH: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 2],
  [3, 4],
  [4, 5],
  [6, 7],
  [7, 8],
  [0, 3],
  [3, 6],
  [1, 4],
  [4, 7],
  [2, 5],
  [5, 8],
  [0, 4],
  [4, 8],
];
const STREAM: Vec3[][] = [-0.6, 0, 0.6].map((y) =>
  arcPoints(
    [MONOLITH[0] + MONOLITH_SIZE[0] / 2, y, 0],
    [SERVICES[3][0] - 0.25, y * 0.9, 0],
    0.15,
    18
  )
);

/** The monolith's faces, with the module grid crowding its front. */
const onMonolith = (random: Random): Vec3 => {
  if (random() < 0.55) {
    return onBox(random, MONOLITH, MONOLITH_SIZE);
  }
  const column = pickIndex(random, 4);
  const row = pickIndex(random, 8);
  const x = MONOLITH[0] - MONOLITH_SIZE[0] / 2 + (column + 0.5) * (MONOLITH_SIZE[0] / 4);
  const y = MONOLITH[1] - MONOLITH_SIZE[1] / 2 + (row + 0.5) * (MONOLITH_SIZE[1] / 8);
  return [x + between(random, -0.09, 0.09), y + between(random, -0.09, 0.09), MONOLITH_SIZE[2] / 2];
};

/** Fragments leaving the monolith: small chunks spread along the stream. */
const onStream = (random: Random): Vec3 => {
  const stream = STREAM[pickIndex(random, STREAM.length)];
  return jitter(random, stream[pickIndex(random, stream.length)], 0.05);
};

export const sampleModernize = (count: number, random: Random): Cloud => {
  const cloud = fillCloud(
    count,
    [
      { weight: 2.4, tag: 1, sample: onMonolith, order: (p) => 0.02 + 0.28 * ((p[1] + 1.2) / 2.3) },
      { weight: 0.8, sample: onStream, order: (p) => 0.32 + 0.22 * ((p[0] + 1.15) / 2) },
      ...SERVICES.map((centre, index) => ({
        weight: 0.4,
        tag: 2,
        sample: (r: Random) => onBox(r, centre, [SERVICE, SERVICE, SERVICE]),
        order: () => 0.5 + index * 0.04 + 0.04 * random(),
      })),
    ],
    random
  );

  const lines = createLines();
  lines.box(MONOLITH, MONOLITH_SIZE, 0.02, 0.3);
  for (let row = 1; row < 8; row += 1) {
    const y = MONOLITH[1] - MONOLITH_SIZE[1] / 2 + (row * MONOLITH_SIZE[1]) / 8;
    const front = MONOLITH_SIZE[2] / 2;
    lines.segment(
      [MONOLITH[0] - 0.5, y, front],
      [MONOLITH[0] + 0.5, y, front],
      0.02 + 0.28 * (row / 8)
    );
  }
  STREAM.forEach((stream, index) => lines.path(stream, 0.32 + index * 0.03, 0.54, true));
  SERVICES.forEach((centre, index) => {
    const from = 0.5 + index * 0.04;
    lines.box(centre, [SERVICE, SERVICE, SERVICE], from, from + 0.04);
  });
  MESH.forEach(([a, b], index) =>
    lines.path([SERVICES[a], SERVICES[b]], 0.88 + index * 0.006, 0.97, true)
  );
  return { ...cloud, lines: lines.build() };
};
