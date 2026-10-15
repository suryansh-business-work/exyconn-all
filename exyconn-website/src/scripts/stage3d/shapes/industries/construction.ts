import {
  GROUND,
  onPerson,
  onPolyline,
  ringPoints,
  rise,
  sweep,
  type IndustryLandmark,
} from "./kit";
import { between, onBox, onSphere, pickIndex, type Random, type Vec3 } from "../sampling";

/**
 * Construction: a site. A tower crane rises at the left, its jib reaching over a concrete
 * frame going up floor by floor on the right (the top floor still only half its columns) and
 * its hook lowering a bundle of materials; a site worker and a big hard hat stand at the front.
 * Use cases: voice and photo site reports land on the worker, procurement on the hook's load,
 * safety on the hard hat, subcontractor scheduling on the frame's floors, drawings at the
 * frame's first floor and cost against budget on the unfinished top.
 */
const MAST_X = -1.1;
const MAST_Z = -0.35;
const MAST_W = 0.16;
const JIB_Y = GROUND + 2.3;
const PEAK_Y = JIB_Y + 0.38;
const JIB_X: readonly [number, number] = [-1.65, 1.3];
const TROLLEY_X = 0.62;
const LOAD: Vec3 = [TROLLEY_X, GROUND + 1.3, MAST_Z];
const FRAME_X = [-0.15, 0.3, 0.75, 1.2];
const FRAME_Z = [-0.65, -0.15];
const FLOOR_H = 0.38;
const FLOORS = 4;
const HAT: Vec3 = [-0.35, GROUND, 0.75];
const HAT_R = 0.24;
const WORKER: Vec3 = [-1.4, GROUND + 0.14, 0.45];

/** The lattice mast: four corner legs and zigzag bracing on its faces. */
const mast = (r: Random): Vec3 => {
  const h = (JIB_Y - GROUND) * r();
  const half = MAST_W / 2;
  if (r() < 0.5) {
    const dx = r() < 0.5 ? -half : half;
    const dz = r() < 0.5 ? -half : half;
    return [MAST_X + dx, GROUND + h, MAST_Z + dz];
  }
  const step = Math.floor(h / MAST_W);
  const t = h / MAST_W - step;
  const across = step % 2 === 0 ? t : 1 - t;
  return [MAST_X - half + across * MAST_W, GROUND + h, MAST_Z + half];
};

/** The jib and counter-jib as a triangular truss, with ties from the peak. */
const jib = (r: Random): Vec3 => {
  const x = between(r, ...JIB_X);
  const pick = r();
  if (pick < 0.6) {
    return [x, JIB_Y + (r() < 0.5 ? 0 : 0.1), MAST_Z + between(r, -0.04, 0.04)];
  }
  const end = x < MAST_X ? JIB_X[0] : JIB_X[1];
  return onPolyline(
    r,
    [
      [MAST_X, PEAK_Y, MAST_Z],
      [end, JIB_Y + 0.1, MAST_Z],
    ],
    0.006
  );
};

const counterweight = (r: Random): Vec3 =>
  onBox(r, [-1.5, JIB_Y - 0.08, MAST_Z], [0.22, 0.2, 0.18]);

const cab = (r: Random): Vec3 => onBox(r, [MAST_X + 0.14, JIB_Y - 0.1, MAST_Z], [0.14, 0.16, 0.16]);

/** The hook's cables and its bundle of beams. */
const hook = (r: Random): Vec3 => {
  if (r() < 0.35) {
    const side = r() < 0.5 ? -0.02 : 0.02;
    return onPolyline(
      r,
      [
        [TROLLEY_X + side, JIB_Y, MAST_Z],
        [TROLLEY_X + side, LOAD[1] + 0.2, MAST_Z],
      ],
      0.004
    );
  }
  return onBox(r, LOAD, [0.38, 0.12, 0.16]);
};

/** The frame: slab edges floor by floor and columns; the top floor only half built. */
const frame = (r: Random): Vec3 => {
  const floor = 1 + pickIndex(r, FLOORS);
  const y = GROUND + floor * FLOOR_H;
  const xs = floor === FLOORS ? FRAME_X.slice(0, 2) : FRAME_X;
  if (r() < 0.5) {
    const x = xs[pickIndex(r, xs.length)];
    const z = FRAME_Z[pickIndex(r, 2)];
    return [x, y - r() * FLOOR_H, z];
  }
  if (floor === FLOORS) {
    return [between(r, FRAME_X[0], FRAME_X[1]), y - FLOOR_H, between(r, FRAME_Z[0], FRAME_Z[1])];
  }
  const x = between(r, FRAME_X[0], FRAME_X[3]);
  return [x, y, r() < 0.5 ? between(r, FRAME_Z[0], FRAME_Z[1]) : FRAME_Z[1]];
};

/** A hard hat: dome, ridge and brim. */
const hat = (r: Random): Vec3 => {
  if (r() < 0.3) {
    return onPolyline(
      r,
      ringPoints([HAT[0], HAT[1] + 0.03, HAT[2]], HAT_R * 1.35, HAT_R * 1.15, 28),
      0.006
    );
  }
  const [x, y, z] = onSphere(r, HAT_R, [HAT[0], HAT[1] + 0.03, HAT[2]]);
  return [x, HAT[1] + 0.03 + Math.abs(y - HAT[1] - 0.03) * 0.95, z];
};

export const CONSTRUCTION: IndustryLandmark = {
  parts: [
    { weight: 1.3, sample: mast, order: rise(0.08, 0.3) },
    { weight: 0.9, sample: jib, order: sweep(0.3, 0.42, -1.65, 2.95) },
    { weight: 0.2, sample: counterweight, order: () => 0.32 },
    { weight: 0.12, sample: cab, order: () => 0.34 },
    { weight: 1.8, sample: frame, order: rise(0.1, 0.4, GROUND, 1.6) },
    { weight: 0.3, tag: 2, sample: hook, order: () => 0.5 },
    { weight: 0.45, tag: 3, sample: hat, order: () => 0.56 },
    { weight: 0.14, tag: 1, sample: (r) => onPerson(r, WORKER, 1.3), order: () => 0.6 },
  ],
  draw: (lines) => {
    lines.box([MAST_X, (GROUND + JIB_Y) / 2, MAST_Z], [MAST_W, JIB_Y - GROUND, MAST_W], 0.08, 0.3);
    lines.segment([JIB_X[0], JIB_Y, MAST_Z], [JIB_X[1], JIB_Y, MAST_Z], 0.36);
    lines.path(
      [
        [JIB_X[0], JIB_Y + 0.1, MAST_Z],
        [MAST_X, PEAK_Y, MAST_Z],
        [JIB_X[1], JIB_Y + 0.1, MAST_Z],
      ],
      0.34,
      0.42
    );
    for (let floor = 1; floor < FLOORS; floor += 1) {
      const centre: Vec3 = [
        (FRAME_X[0] + FRAME_X[3]) / 2,
        GROUND + floor * FLOOR_H,
        (FRAME_Z[0] + FRAME_Z[1]) / 2,
      ];
      lines.box(
        centre,
        [FRAME_X[3] - FRAME_X[0], 0.03, FRAME_Z[1] - FRAME_Z[0]],
        0.1 + floor * 0.08,
        0.12 + floor * 0.08
      );
    }
  },
  icons: ["mic", "parcel", "shield", "calendar", "document", "chart"],
  anchors: [
    [WORKER[0], WORKER[1] + 0.14, WORKER[2]],
    [LOAD[0] + 0.15, LOAD[1], LOAD[2]],
    [HAT[0], HAT[1] + HAT_R, HAT[2]],
    [FRAME_X[3], GROUND + 2 * FLOOR_H, FRAME_Z[1]],
    [FRAME_X[0], GROUND + FLOOR_H, FRAME_Z[1]],
    [FRAME_X[1], GROUND + FLOORS * FLOOR_H, FRAME_Z[1]],
  ],
};
