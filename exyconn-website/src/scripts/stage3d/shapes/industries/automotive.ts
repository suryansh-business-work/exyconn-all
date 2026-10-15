import {
  GROUND,
  onDisc,
  onDrawing,
  onPolyline,
  ringPoints,
  rise,
  sweep,
  type IndustryLandmark,
} from "./kit";
import { arc, box, circle, line } from "../../../../lib/detail/glyphs";
import { between, onBox, pickIndex, type Random, type Vec3 } from "../sampling";

/**
 * Automotive: a dealership. A car in side profile stands on a round showroom turntable in the
 * middle, a two-post service lift with raised arms waits at the back left and an EV charging
 * post with its cable plugged in stands at the right. Use cases: test-drive booking lands on
 * the car's cabin, the sales assistant on its bonnet, service booking on the lift, service
 * status on the charger's screen, finance paperwork and performance on the turntable's rim.
 */
const TABLE: Vec3 = [0.15, GROUND + 0.04, 0.05];
const TABLE_R = 1.1;
const DECK = TABLE[1] + 0.02;
const CAR_X = 0.15;
const CAR_Z = 0.05;
/** The outline is drawn a little small; this sizes the car to the turntable. */
const SIZE = 1.3;
const HALF_WIDTH = 0.34;
const WHEEL_R = 0.15 * SIZE;
const WHEELS = [-0.55, 0.45];
const wheelArch = (x: number) => arc(x, 0.12, 0.19, 0, Math.PI, 8);
/** The body's side outline, nose to the right, y above the deck. */
const OUTLINE: readonly (readonly [number, number])[] = [
  [-0.92, 0.12],
  [-0.95, 0.32],
  [-0.86, 0.4],
  [-0.6, 0.43],
  [-0.38, 0.66],
  [0.05, 0.68],
  [0.32, 0.45],
  [0.78, 0.39],
  [0.88, 0.27],
  [0.86, 0.12],
  ...wheelArch(WHEELS[1]),
  ...wheelArch(WHEELS[0]),
  [-0.92, 0.12],
];
const WINDOWS: readonly (readonly [number, number])[] = [
  [-0.4, 0.45],
  [-0.33, 0.62],
  [0.03, 0.63],
  [0.24, 0.45],
  [-0.4, 0.45],
];
const PILLAR: readonly (readonly [number, number])[] = [
  [-0.1, 0.45],
  [-0.1, 0.63],
];
const toWorld = (path: readonly (readonly [number, number])[], z: number): Vec3[] =>
  path.map(([x, y]): Vec3 => [CAR_X + x * SIZE, DECK + y * SIZE, z]);
const LIFT_X = [-1.62, -1.18];
const LIFT_Z = -0.7;
const LIFT_H = 1.25;
const ARMS_Y = GROUND + 0.62;
const CHARGER: Vec3 = [1.55, GROUND + 0.4, -0.45];

/** The body: its outline on both sides, and swept across the width for roof and bonnet. */
const body = (r: Random): Vec3 => {
  const side = r() < 0.5 ? -HALF_WIDTH : HALF_WIDTH;
  if (r() < 0.62) {
    return onPolyline(r, toWorld(OUTLINE, CAR_Z + side), 0.006);
  }
  const [x, y] = onPolyline(r, toWorld(OUTLINE.slice(0, 10), CAR_Z), 0.004);
  return [x, y, CAR_Z + between(r, -HALF_WIDTH, HALF_WIDTH)];
};

const glass = (r: Random): Vec3 => {
  const z = CAR_Z + HALF_WIDTH + 0.005;
  return onPolyline(r, toWorld(r() < 0.85 ? WINDOWS : PILLAR, z), 0.005);
};

const wheel = (r: Random): Vec3 => {
  const x = CAR_X + WHEELS[pickIndex(r, 2)] * SIZE;
  const z = CAR_Z + (r() < 0.5 ? -HALF_WIDTH : HALF_WIDTH);
  const paths = [circle(0, 0, 1, 16), circle(0, 0, 0.5, 10)];
  return onDrawing(r, paths, [x, DECK + WHEEL_R, z], WHEEL_R);
};

/** The turntable: a ring of light round its edge and a faint deck. */
const turntable = (r: Random): Vec3 => {
  if (r() < 0.75) {
    return onPolyline(r, ringPoints(TABLE, TABLE_R, TABLE_R, 40), 0.006);
  }
  return onDisc(r, TABLE, TABLE_R);
};

const lift = (r: Random): Vec3 => {
  const x = LIFT_X[pickIndex(r, 2)];
  return onBox(r, [x, GROUND + LIFT_H / 2, LIFT_Z], [0.1, LIFT_H, 0.1]);
};

/** The lift's four arms swung forward under the car's sills, raised to mid height. */
const ARMS: readonly Vec3[][] = LIFT_X.flatMap((x) =>
  [-0.12, 0.12].map((reach): Vec3[] => [
    [x, ARMS_Y, LIFT_Z],
    [x + reach + 0.25, ARMS_Y, LIFT_Z + 0.5],
  ])
);

const arms = (r: Random): Vec3 => onPolyline(r, ARMS[pickIndex(r, ARMS.length)], 0.008);

/** The charger's screen and a bolt on it. */
const SCREEN = [box(-1, -1, 1, 1), line([0.2, 0.7], [-0.3, 0], [0.2, 0], [-0.2, -0.7])];
const screen = (r: Random): Vec3 =>
  onDrawing(r, SCREEN, [CHARGER[0], CHARGER[1] + 0.2, CHARGER[2] + 0.1], 0.09);

const CABLE: Vec3[] = [
  [CHARGER[0] - 0.05, CHARGER[1] - 0.05, CHARGER[2] + 0.1],
  [CHARGER[0] - 0.2, GROUND + 0.15, 0],
  [CAR_X + 0.82 * SIZE, DECK + 0.32 * SIZE, CAR_Z - HALF_WIDTH],
];

export const AUTOMOTIVE: IndustryLandmark = {
  parts: [
    { weight: 0.9, sample: turntable, order: sweep(0.08, 0.16) },
    { weight: 2.4, sample: body, order: sweep(0.2, 0.42) },
    { weight: 0.5, sample: glass, order: () => 0.44 },
    { weight: 0.6, sample: wheel, order: () => 0.18 },
    { weight: 0.55, sample: lift, order: rise(0.12, 0.3) },
    { weight: 0.25, tag: 3, sample: arms, order: () => 0.48 },
    { weight: 0.35, sample: (r) => onBox(r, CHARGER, [0.18, 0.8, 0.18]), order: rise(0.2, 0.34) },
    { weight: 0.15, tag: 4, sample: screen, order: () => 0.56 },
    { weight: 0.15, sample: (r) => onPolyline(r, CABLE, 0.006), order: () => 0.6 },
  ],
  draw: (lines) => {
    lines.path(ringPoints(TABLE, TABLE_R * 0.92, TABLE_R * 0.92, 40), 0.08, 0.16);
    [-HALF_WIDTH, HALF_WIDTH].forEach((side) => {
      lines.path(toWorld(OUTLINE.slice(0, 10), CAR_Z + side), 0.2, 0.42);
    });
    lines.path(
      [
        [LIFT_X[0], GROUND + LIFT_H, LIFT_Z],
        [LIFT_X[1], GROUND + LIFT_H, LIFT_Z],
      ],
      0.3,
      0.32
    );
    lines.box(CHARGER, [0.18, 0.8, 0.18], 0.2, 0.34);
  },
  icons: ["calendar", "chat", "wrench", "bell", "document", "chart"],
  anchors: [
    [CAR_X - 0.15 * SIZE, DECK + 0.68 * SIZE, CAR_Z],
    [CAR_X + 0.6 * SIZE, DECK + 0.41 * SIZE, CAR_Z],
    [LIFT_X[0] + 0.1, ARMS_Y, LIFT_Z + 0.3],
    [CHARGER[0], CHARGER[1] + 0.3, CHARGER[2] + 0.1],
    [TABLE[0] - 0.75, TABLE[1], TABLE[2] + 0.8],
    [TABLE[0] + 0.75, TABLE[1], TABLE[2] + 0.8],
  ],
};
