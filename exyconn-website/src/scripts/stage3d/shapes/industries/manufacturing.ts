import {
  drawBlock,
  GROUND,
  onDrawing,
  onFacade,
  onPolyline,
  rise,
  sweep,
  type Block,
  type IndustryLandmark,
} from "./kit";
import { circle, gear } from "../../../../lib/detail/glyphs";
import {
  between,
  onBox,
  onCylinder,
  onSphere,
  pickIndex,
  type Random,
  type Vec3,
} from "../sampling";

/**
 * Manufacturing: a factory. A long shed under a saw-tooth roof with two chimneys puffing
 * smoke stands at the back, a pair of meshed gears turns at the front left and a conveyor
 * carries boxes through an inspection gate on the right. Use cases: predictive maintenance
 * lands on the big gear, quality inspection on the gate, production planning on the shop
 * floor, inventory on the boxes, safety on the small gear and output dashboards up the stacks.
 */
const SHED: Block = [0.4, -0.55, 2, 0.8, 0.8];
const EAVES = GROUND + SHED[4];
const TEETH = 5;
const TOOTH_W = SHED[2] / TEETH;
const TOOTH_H = 0.26;
const SHED_LEFT = SHED[0] - SHED[2] / 2;
const SHED_Z: readonly [number, number] = [SHED[1] - SHED[3] / 2, SHED[1] + SHED[3] / 2];
const STACKS = [0.95, 1.22];
const STACK_TOP = GROUND + 2.25;
const BIG: Vec3 = [-1.18, -0.42, 0.4];
const BIG_R = 0.4;
const SMALL: Vec3 = [-0.75, -0.83, 0.4];
const SMALL_R = 0.24;
const BELT_Y = GROUND + 0.3;
const BELT_Z = 0.55;
const BELT_Z_EDGES = [BELT_Z - 0.14, BELT_Z + 0.14];
const BELT_X: readonly [number, number] = [-0.35, 1.55];
const BOXES = [-0.05, 0.4, 1.3];
const GATE_X = 0.88;

/** Saw-tooth roof: a sloped run then a glazed vertical drop, five times along x. */
const roof = (r: Random): Vec3 => {
  const x0 = SHED_LEFT + pickIndex(r, TEETH) * TOOTH_W;
  const z = between(r, ...SHED_Z);
  if (r() < 0.72) {
    const t = r();
    return [x0 + t * TOOTH_W, EAVES + t * TOOTH_H, z];
  }
  return [x0 + TOOTH_W, EAVES + r() * TOOTH_H, z];
};

const toothProfile = (z: number): Vec3[] =>
  Array.from({ length: TEETH }, (_, k): Vec3[] => [
    [SHED_LEFT + k * TOOTH_W, EAVES, z],
    [SHED_LEFT + (k + 1) * TOOTH_W, EAVES + TOOTH_H, z],
    [SHED_LEFT + (k + 1) * TOOTH_W, EAVES, z],
  ]).flat();

const stack = (r: Random): Vec3 =>
  onCylinder(r, [STACKS[pickIndex(r, 2)], EAVES, SHED[1]], 0.07, STACK_TOP - EAVES);

/** Smoke puffs drifting right off each stack, growing as they rise. */
const smoke = (r: Random): Vec3 => {
  const puff = pickIndex(r, 3);
  const x = STACKS[pickIndex(r, 2)] + 0.08 + puff * 0.1;
  return onSphere(r, 0.05 + puff * 0.025, [x, STACK_TOP + 0.08 + puff * 0.09, SHED[1]]);
};

/** A cog standing upright, its two faces a little apart. */
const cog = (centre: Vec3, radius: number, teeth: number, turn: number) => {
  const rim = gear(0, 0, 1, 0.8, teeth);
  const paths = [rim, rim, rim, circle(0, 0, 0.3, 12)];
  return (r: Random): Vec3 => {
    const [x, y, z] = onDrawing(r, paths, [0, 0, 0], radius);
    const cos = Math.cos(turn);
    const sin = Math.sin(turn);
    const face = r() < 0.5 ? -0.05 : 0.05;
    return [centre[0] + x * cos - y * sin, centre[1] + x * sin + y * cos, centre[2] + z + face];
  };
};

/** The belt's top and bottom runs and its end rollers. */
const belt = (r: Random): Vec3 => {
  const z = BELT_Z + between(r, -0.14, 0.14);
  if (r() < 0.2) {
    const end = BELT_X[pickIndex(r, 2)];
    return onDrawing(r, [circle(0, 0, 1, 12)], [end, BELT_Y - 0.05, z], 0.05);
  }
  const top = r() < 0.7 ? BELT_Y : BELT_Y - 0.1;
  return [between(r, ...BELT_X), top, z];
};

const legs = (r: Random): Vec3 => {
  const x = [-0.25, 0.6, 1.45][pickIndex(r, 3)];
  const z = BELT_Z + (r() < 0.5 ? -0.12 : 0.12);
  return onPolyline(
    r,
    [
      [x, GROUND, z],
      [x, BELT_Y - 0.1, z],
    ],
    0.006
  );
};

const GATE: Vec3[] = [
  [GATE_X - 0.16, GROUND, BELT_Z],
  [GATE_X - 0.16, BELT_Y + 0.38, BELT_Z],
  [GATE_X + 0.16, BELT_Y + 0.38, BELT_Z],
  [GATE_X + 0.16, GROUND, BELT_Z],
];

export const MANUFACTURING: IndustryLandmark = {
  parts: [
    { weight: 1.6, sample: (r) => onFacade(r, SHED, 0.16, 0.18), order: rise(0.08, 0.24) },
    { weight: 1.3, sample: roof, order: sweep(0.22, 0.32) },
    { weight: 0.5, sample: stack, order: rise(0.3, 0.42, EAVES, 1.4) },
    { weight: 0.3, sample: smoke, order: () => 0.58 },
    { weight: 0.9, tag: 1, sample: cog(BIG, BIG_R, 12, 0), order: () => 0.44 },
    { weight: 0.65, sample: cog(SMALL, SMALL_R, 8, Math.PI / 8), order: () => 0.46 },
    { weight: 0.9, sample: belt, order: sweep(0.34, 0.44) },
    { weight: 0.12, sample: legs, order: () => 0.34 },
    { weight: 0.18, tag: 2, sample: (r) => onPolyline(r, GATE, 0.008), order: () => 0.52 },
    ...BOXES.map((x, i) => ({
      weight: 0.1,
      tag: 4,
      sample: (r: Random) => onBox(r, [x, BELT_Y + 0.09, BELT_Z], [0.2, 0.18, 0.2]),
      order: () => 0.54 + i * 0.02,
    })),
  ],
  draw: (lines) => {
    drawBlock(lines, SHED, 0.08, 0.24);
    SHED_Z.forEach((z) => lines.path(toothProfile(z), 0.24, 0.32));
    lines.path(GATE, 0.5, 0.54);
    BELT_Z_EDGES.forEach((z) => {
      lines.segment([BELT_X[0], BELT_Y, z], [BELT_X[1], BELT_Y, z], 0.36);
    });
    BOXES.forEach((x, i) => {
      lines.box([x, BELT_Y + 0.09, BELT_Z], [0.2, 0.18, 0.2], 0.54 + i * 0.02, 0.56 + i * 0.02);
    });
  },
  icons: ["wrench", "check", "calendar", "parcel", "shield", "chart"],
  anchors: [
    [BIG[0], BIG[1] + BIG_R, BIG[2]],
    [GATE_X, BELT_Y + 0.38, BELT_Z],
    [-0.2, GROUND + 0.5, SHED_Z[1]],
    [BOXES[2], BELT_Y + 0.18, BELT_Z],
    [SMALL[0] - 0.1, SMALL[1], SMALL[2]],
    [STACKS[1], STACK_TOP, SHED[1]],
  ],
};
