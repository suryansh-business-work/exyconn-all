import {
  drawBlock,
  GROUND,
  onDisc,
  onDrawing,
  onPerson,
  onPolyline,
  ringPoints,
  rise,
  type Block,
  type IndustryLandmark,
} from "./kit";
import { arc, box, circle, line } from "../../../../lib/detail/glyphs";
import { between, jitter, onBox, onSphere, pickIndex, type Random, type Vec3 } from "../sampling";

/**
 * Restaurants: a dining room in front of its kitchen. Six round tables laid with plates fill
 * the floor; behind them the kitchen wall opens on a pass under three hanging lamps, a chef
 * and a big silver cloche on it, stock crates stacked by the kitchen door, and a delivery
 * scooter waits outside. Use cases: reservations land on the front tables, voice orders on
 * the pass, delivery apps on the scooter, inventory on the crates, reviews on the back
 * tables and food-cost reports on the cloche.
 */
const KITCHEN: Block = [0.1, -0.78, 2.4, 0.4, 1.55];
const FRONT_Z = KITCHEN[1] + KITCHEN[3] / 2;
const PASS = { x0: -0.75, x1: 0.75, y0: GROUND + 0.55, y1: GROUND + 1.1 };
const LAMP_TOP = GROUND + 1.5;
const TABLE_Y = GROUND + 0.3;
const TABLES: readonly Vec3[] = [-0.75, 0, 0.75].flatMap((x, i) => [
  [x + 0.12, TABLE_Y, 0.72] as Vec3,
  [x - 0.12 + i * 0.04, TABLE_Y, 0.08] as Vec3,
]);
const CLOCHE: Vec3 = [0.3, PASS.y0 + 0.02, FRONT_Z + 0.08];
const SCOOTER: Vec3 = [-1.38, GROUND, 0.55];

/** The kitchen wall on a dotted grid, open at the pass. */
const wall = (r: Random): Vec3 => {
  for (;;) {
    const x = KITCHEN[0] - KITCHEN[2] / 2 + (pickIndex(r, 24) + 0.5) * 0.1;
    const y = GROUND + (pickIndex(r, 15) + 0.5) * 0.1;
    const open = x > PASS.x0 && x < PASS.x1 && y > PASS.y0 && y < PASS.y1;
    if (!open) {
      return jitter(r, [x, y, FRONT_Z], 0.008);
    }
  }
};

/** The pass shelf and, through the hatch, a chef at work. */
const pass = (r: Random): Vec3 => {
  if (r() < 0.45) {
    return onPerson(r, [-0.35, PASS.y0 + 0.2, FRONT_Z - 0.15], 1.3);
  }
  return [between(r, PASS.x0, PASS.x1), PASS.y0, between(r, FRONT_Z - 0.1, FRONT_Z + 0.16)];
};

/** Three pendant lamps on cords over the pass. */
const lamp = (r: Random): Vec3 => {
  const x = -0.5 + pickIndex(r, 3) * 0.5;
  const z = FRONT_Z + 0.25;
  if (r() < 0.3) {
    return [x, between(r, LAMP_TOP - 0.25, LAMP_TOP), z];
  }
  const t = r();
  const angle = r() * Math.PI * 2;
  const radius = 0.03 + 0.11 * t;
  return [x + radius * Math.cos(angle), LAMP_TOP - 0.25 - 0.13 * t, z + radius * Math.sin(angle)];
};

const cloche = (r: Random): Vec3 => {
  const pick = r();
  if (pick < 0.2) {
    return onPolyline(r, ringPoints(CLOCHE, 0.3, 0.2, 28), 0.005);
  }
  if (pick < 0.27) {
    return onSphere(r, 0.035, [CLOCHE[0], CLOCHE[1] + 0.27, CLOCHE[2]]);
  }
  const point = onSphere(r, 0.24, [0, 0, 0]);
  return [CLOCHE[0] + point[0], CLOCHE[1] + Math.abs(point[1]), CLOCHE[2] + point[2] * 0.7];
};

/** A round table on its pedestal, laid with two plates. */
const table =
  (at: Vec3) =>
  (r: Random): Vec3 => {
    const pick = r();
    if (pick < 0.35) {
      return onDisc(r, at, 0.18);
    }
    if (pick < 0.65) {
      const side = r() < 0.5 ? -1 : 1;
      const seat = at[0] + side * 0.26;
      const back = seat + side * 0.1;
      const chair: Vec3[] = [
        [seat, GROUND, at[2]],
        [seat, GROUND + 0.17, at[2]],
        [back, GROUND + 0.17, at[2]],
        [back, GROUND + 0.42, at[2]],
      ];
      return onPolyline(r, chair, 0.005);
    }
    if (pick < 0.85) {
      const side = r() < 0.5 ? -0.1 : 0.1;
      const plate = ringPoints([at[0] + side, at[1] + 0.015, at[2]], 0.055, 0.04, 12);
      return onPolyline(r, plate, 0.003);
    }
    return [at[0], between(r, GROUND, at[1]), at[2]];
  };

/** The scooter in profile: wheels, body, handlebar, and a delivery box on the back. */
const SCOOTER_PATHS = [
  circle(-0.62, -0.72, 0.26, 16),
  circle(0.62, -0.72, 0.26, 16),
  line([-0.62, -0.72], [-0.4, -0.3], [0.25, -0.3], [0.45, 0.1], [0.62, -0.72]),
  line([0.45, 0.1], [0.55, 0.55], [0.75, 0.55]),
  line([-0.2, -0.3], [-0.2, -0.05], [0.25, -0.05]),
  line([-0.95, -0.05], [-0.95, 0.6], [-0.3, 0.6], [-0.3, -0.05], [-0.95, -0.05]),
  arc(-0.62, 0.28, 0.12, 0, Math.PI, 6),
];

const scooter = (r: Random): Vec3 => {
  const point = onDrawing(r, SCOOTER_PATHS, [SCOOTER[0], GROUND + 0.4, SCOOTER[2]], 0.38);
  return [point[0], point[1], point[2] + between(r, -0.06, 0.06)];
};

const CRATES: readonly Vec3[] = [
  [1.48, GROUND + 0.14, -0.35],
  [1.48, GROUND + 0.42, -0.35],
  [1.15, GROUND + 0.14, -0.35],
];
const crates = (r: Random) => onBox(r, CRATES[pickIndex(r, CRATES.length)], [0.31, 0.28, 0.3]);

export const RESTAURANT: IndustryLandmark = {
  parts: [
    { weight: 2.6, sample: wall, order: rise(0.08, 0.34, GROUND, 1.55) },
    { weight: 0.45, sample: pass, order: () => 0.36 },
    { weight: 0.4, sample: lamp, order: () => 0.44 },
    { weight: 0.6, sample: cloche, order: rise(0.5, 0.58, CLOCHE[1], 0.3) },
    ...TABLES.map((at, i) => ({
      weight: 0.4,
      sample: table(at),
      order: () => 0.2 + i * 0.03,
    })),
    { weight: 0.55, tag: 3, sample: scooter, order: rise(0.46, 0.56, GROUND, 0.7) },
    { weight: 0.3, tag: 4, sample: crates, order: rise(0.38, 0.44, GROUND, 0.56) },
  ],
  draw: (lines) => {
    drawBlock(lines, KITCHEN, 0.08, 0.34);
    const hatch = box(PASS.x0, PASS.y0, PASS.x1, PASS.y1).map(([x, y]): Vec3 => [x, y, FRONT_Z]);
    lines.path(hatch, 0.3, 0.36);
  },
  icons: ["calendar", "mic", "route", "parcel", "star", "chart"],
  anchors: [
    [TABLES[0][0], TABLE_Y, TABLES[0][2]],
    [0.6, PASS.y0 + 0.02, FRONT_Z + 0.1],
    [SCOOTER[0] + 0.15, GROUND + 0.55, SCOOTER[2]],
    [1.3, GROUND + 0.56, -0.2],
    [TABLES[1][0], TABLE_Y, TABLES[1][2]],
    [CLOCHE[0], CLOCHE[1] + 0.3, CLOCHE[2]],
  ],
};
