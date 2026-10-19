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
import { arc, box, line } from "../../../../lib/detail/glyphs";
import { between, jitter, onBox, pickIndex, type Random, type Vec3 } from "../sampling";

/**
 * Cafés: a coffee shop. A storefront with "CAFE" over a big window, a striped awning, and
 * behind the glass a counter with an espresso machine and a barista; a giant steaming cup
 * sits out front, a bistro table with two chairs beside it, and crates of beans by the side
 * door. Use cases: chat orders land on the espresso machine, loyalty at the regulars' table,
 * reviews on the cup, stock reorders on the bean crates, the staff rota on the barista and
 * daily sales at the shop door.
 */
const SHOP: Block = [0, -0.6, 2.2, 0.55, 1.45];
const FRONT_Z = SHOP[1] + SHOP[3] / 2;
const WINDOW = { x0: -0.9, x1: 0.35, y0: GROUND + 0.15, y1: GROUND + 1 };
const DOOR = { x0: 0.5, x1: 0.85, y0: GROUND, y1: GROUND + 0.95 };
const AWNING = { y0: GROUND + 1.1, y1: GROUND + 0.86, z1: FRONT_Z + 0.42, half: 1.05 };
const SIGN_Y = GROUND + 1.29;
const CUP: Vec3 = [-1.05, GROUND, 0.6];
const TABLE: Vec3 = [0.98, GROUND, 0.72];
const STRIPES = 10;

const inOpening = (x: number, y: number): boolean =>
  (x > WINDOW.x0 && x < WINDOW.x1 && y > WINDOW.y0 && y < WINDOW.y1) ||
  (x > DOOR.x0 && x < DOOR.x1 && y < DOOR.y1);

/** The front wall on a dotted grid, leaving the window and door open. */
const wall = (r: Random): Vec3 => {
  for (;;) {
    const x = -SHOP[2] / 2 + (pickIndex(r, 22) + 0.5) * 0.1;
    const y = GROUND + (pickIndex(r, 14) + 0.5) * 0.1;
    if (!inOpening(x, y)) {
      return jitter(r, [x, y, FRONT_Z], 0.008);
    }
  }
};

/** Every other stripe of the sloped awning, and its scalloped hem. */
const awning = (r: Random): Vec3 => {
  const width = (AWNING.half * 2) / STRIPES;
  if (r() < 0.2) {
    const k = pickIndex(r, STRIPES);
    const scallop = arc(0, 0, width / 2, Math.PI, Math.PI * 2, 6).map(([x, y]): Vec3 => [
      -AWNING.half + (k + 0.5) * width + x,
      AWNING.y1 + y,
      AWNING.z1,
    ]);
    return onPolyline(r, scallop, 0.004);
  }
  const x = -AWNING.half + (pickIndex(r, STRIPES / 2) * 2 + r()) * width;
  const t = r();
  return [x, AWNING.y0 + (AWNING.y1 - AWNING.y0) * t, FRONT_Z + (AWNING.z1 - FRONT_Z) * t];
};

/** The counter's front and top behind the window. */
const counter = (r: Random): Vec3 => {
  const x = between(r, -0.85, 0.25);
  if (r() < 0.35) {
    return [x, GROUND + 0.42, between(r, -0.7, -0.5)];
  }
  return jitter(r, [x, GROUND + (pickIndex(r, 4) + 0.5) * 0.105, -0.5], 0.006);
};

/** The espresso machine face-on: body, drip tray, two group heads, cups on top. */
const ESPRESSO = [
  line([-0.9, -1], [-0.9, 0.7], [0.9, 0.7], [0.9, -1]),
  line([-0.9, -0.75], [0.9, -0.75]),
  line([-0.55, 0.15], [-0.55, -0.15], [-0.25, -0.15], [-0.25, 0.15]),
  line([0.25, 0.15], [0.25, -0.15], [0.55, -0.15], [0.55, 0.15]),
  line([-0.6, 0.7], [-0.6, 0.95], [-0.3, 0.95], [-0.3, 0.7]),
  line([0.3, 0.7], [0.3, 0.95], [0.6, 0.95], [0.6, 0.7]),
];

const LETTERS = [
  [arc(0, 0, 0.85, Math.PI * 0.3, Math.PI * 1.7, 12)],
  [line([-0.7, -0.9], [0, 0.9], [0.7, -0.9]), line([-0.4, -0.15], [0.4, -0.15])],
  [line([0.7, 0.9], [-0.6, 0.9], [-0.6, -0.9]), line([-0.6, 0], [0.4, 0])],
  [line([0.7, 0.9], [-0.6, 0.9], [-0.6, -0.9], [0.7, -0.9]), line([-0.6, 0], [0.4, 0])],
];

const sign = (r: Random): Vec3 => {
  const k = pickIndex(r, LETTERS.length);
  return onDrawing(r, LETTERS[k], [-0.4 + k * 0.27, SIGN_Y, FRONT_Z + 0.02], 0.1);
};

/** The giant cup: saucer, tapered wall, coffee, and a handle facing out. */
const cup = (r: Random): Vec3 => {
  const pick = r();
  if (pick < 0.2) {
    return onPolyline(r, ringPoints([CUP[0], GROUND + 0.02, CUP[2]], 0.42, 0.25, 28), 0.006);
  }
  if (pick < 0.3) {
    const angle = between(r, Math.PI * 0.5, Math.PI * 1.5);
    return [CUP[0] - 0.29 + 0.12 * Math.cos(angle), GROUND + 0.24 + 0.1 * Math.sin(angle), CUP[2]];
  }
  if (pick < 0.42) {
    return onDisc(r, [CUP[0], GROUND + 0.42, CUP[2]], 0.28);
  }
  const t = r();
  const angle = r() * Math.PI * 2;
  const radius = 0.2 + 0.1 * t;
  return [
    CUP[0] + radius * Math.cos(angle),
    GROUND + 0.04 + 0.38 * t,
    CUP[2] + radius * 0.6 * Math.sin(angle),
  ];
};

const steam = (r: Random): Vec3 => {
  const k = pickIndex(r, 3);
  const t = r();
  const x = CUP[0] + (k - 1) * 0.11 + 0.04 * Math.sin(t * 9 + k * 2);
  return jitter(r, [x, GROUND + 0.5 + 0.6 * t, CUP[2]], 0.006);
};

/** A bistro chair in profile, its back away from the table on `side`. */
const CHAIR = [line([-0.6, -1], [-0.55, -0.1], [0.5, -0.1]), line([0.5, -1], [0.5, 1])];
const chair =
  (side: number) =>
  (r: Random): Vec3 => {
    const [x, y, z] = onDrawing(r, CHAIR, [0, GROUND + 0.29, TABLE[2]], 0.29);
    return [TABLE[0] + side * (0.44 + x), y, z];
  };

const table = (r: Random): Vec3 => {
  const top: Vec3 = [TABLE[0], GROUND + 0.42, TABLE[2]];
  if (r() < 0.6) {
    return onDisc(r, top, 0.22);
  }
  return onPolyline(r, [[TABLE[0] - 0.1, GROUND, TABLE[2]], [TABLE[0], GROUND, TABLE[2]], top]);
};

const CRATES: readonly Vec3[] = [
  [1.42, GROUND + 0.15, -0.5],
  [1.4, GROUND + 0.44, -0.52],
];
const crates = (r: Random) => onBox(r, CRATES[pickIndex(r, 2)], [0.3, 0.29, 0.28]);
const espresso = (r: Random) => onDrawing(r, ESPRESSO, [-0.25, GROUND + 0.62, -0.6], 0.2);
const barista = (r: Random) => onPerson(r, [-0.72, GROUND + 0.62, -0.68], 1.1);

export const CAFE: IndustryLandmark = {
  parts: [
    { weight: 2.6, sample: wall, order: rise(0.08, 0.36, GROUND, 1.45) },
    { weight: 1.3, sample: awning, order: () => 0.4 },
    { weight: 0.5, sample: sign, order: () => 0.5 },
    { weight: 0.3, sample: counter, order: () => 0.24 },
    { weight: 0.3, sample: espresso, order: () => 0.3 },
    { weight: 0.18, tag: 5, sample: barista, order: () => 0.56 },
    { weight: 0.9, sample: cup, order: rise(0.3, 0.42, GROUND, 0.4) },
    { weight: 0.28, sample: steam, order: rise(0.5, 0.62, GROUND + 0.5, 0.6) },
    { weight: 0.3, sample: table, order: () => 0.44 },
    { weight: 0.14, sample: chair(-1), order: () => 0.46 },
    { weight: 0.14, sample: chair(1), order: () => 0.47 },
    { weight: 0.36, tag: 4, sample: crates, order: rise(0.34, 0.4, GROUND, 0.6) },
  ],
  draw: (lines) => {
    drawBlock(lines, SHOP, 0.08, 0.36);
    [WINDOW, DOOR].forEach(({ x0, y0, x1, y1 }, i) => {
      const frame = box(x0, y0, x1, y1).map(([x, y]): Vec3 => [x, y, FRONT_Z]);
      lines.path(frame, 0.2 + i * 0.02, 0.24 + i * 0.02);
    });
    lines.segment([-AWNING.half, AWNING.y1, AWNING.z1], [AWNING.half, AWNING.y1, AWNING.z1], 0.42);
  },
  icons: ["chat", "heart", "star", "parcel", "clock", "chart"],
  anchors: [
    [-0.25, GROUND + 0.62, -0.58],
    [TABLE[0], GROUND + 0.42, TABLE[2]],
    [CUP[0], GROUND + 0.42, CUP[2]],
    [1.4, GROUND + 0.5, -0.39],
    [-0.72, GROUND + 0.72, -0.68],
    [0.68, GROUND + 0.6, FRONT_Z],
  ],
};
