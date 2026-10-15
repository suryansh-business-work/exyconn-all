import { box, line, roundedRect } from "../../../../lib/detail/glyphs";
import { ICONS } from "./icons";
import {
  drawBlock,
  GROUND,
  onDisc,
  onDrawing,
  onFacade,
  onPerson,
  onPolyline,
  rise,
  ringPoints,
  type Block,
  type IndustryLandmark,
} from "./kit";
import { between, onBox, onCylinder, type Random, type Vec3 } from "../sampling";

/**
 * Professional services: a firm's office. A glass tower and a lower wing with a clock on its
 * roof stand behind a large briefcase, papers peeking out of it, and a round meeting table
 * with three colleagues. Use cases: enquiries land on the tower's upper floors, meetings at
 * the table, document drafting on the briefcase's papers, timesheets on the clock, search over
 * past work on the tower's archive floors and utilisation on the wing.
 */
const TOWER: Block = [-0.4, -0.7, 0.95, 0.6, 2.4];
const WING: Block = [0.85, -0.7, 0.85, 0.5, 1.3];
const TOWER_FRONT = TOWER[1] + TOWER[3] / 2;
const WING_FRONT = WING[1] + WING[3] / 2;
const CLOCK: Vec3 = [WING[0], GROUND + WING[4] + 0.2, WING[1]];

const clock = (r: Random): Vec3 => {
  if (r() < 0.15) {
    return onPolyline(
      r,
      [
        [CLOCK[0], GROUND + WING[4], CLOCK[2]],
        [CLOCK[0], CLOCK[1] - 0.15, CLOCK[2]],
      ],
      0.006
    );
  }
  return onDrawing(r, ICONS.clock, CLOCK, 0.17);
};

/** The briefcase standing on its edge: its outline front and back, handle, lid seam, clasps. */
const CASE: Vec3 = [-0.62, GROUND + 0.42, 0.8];
const CASE_SCALE = 0.42;
const CASE_DEPTH = 0.28;
const CASE_TOP = CASE[1] + CASE_SCALE;
const CASE_FACE = [
  roundedRect(-1.4, -1, 1.4, 1, 0.18),
  line([-1.4, 0.55], [1.4, 0.55]),
  box(-0.85, 0.35, -0.6, 0.62),
  box(0.6, 0.35, 0.85, 0.62),
];
const CASE_HANDLE = [roundedRect(-0.45, 1, 0.45, 1.42, 0.16), roundedRect(-0.3, 1, 0.3, 1.3, 0.1)];
const briefcase = (r: Random): Vec3 => {
  const pick = r();
  if (pick < 0.55) {
    return onDrawing(r, CASE_FACE, [CASE[0], CASE[1], CASE[2] + CASE_DEPTH / 2], CASE_SCALE);
  }
  if (pick < 0.72) {
    return onDrawing(r, CASE_HANDLE, CASE, CASE_SCALE);
  }
  if (pick < 0.9) {
    return onDrawing(
      r,
      CASE_FACE.slice(0, 1),
      [CASE[0], CASE[1], CASE[2] - CASE_DEPTH / 2],
      CASE_SCALE
    );
  }
  return onBox(r, CASE, [CASE_SCALE * 2.8, CASE_SCALE * 2, CASE_DEPTH]);
};

/** Two sheets peeking out of the briefcase. */
const papers = (r: Random): Vec3 => {
  const k = r() < 0.5 ? 0 : 1;
  const x = CASE[0] - 0.25 + k * 0.12 + between(r, -0.15, 0.15);
  return [x, CASE_TOP + between(r, 0, 0.16 - k * 0.04), CASE[2] - 0.04 + k * 0.05];
};

/** A round meeting table on a pedestal, three colleagues seated round its far side. */
const TABLE: Vec3 = [0.95, GROUND + 0.36, 0.6];
const table = (r: Random): Vec3 => {
  const pick = r();
  if (pick < 0.45) {
    return onPolyline(r, ringPoints(TABLE, 0.55, 0.34), 0.006);
  }
  if (pick < 0.75) {
    return onDisc(r, TABLE, 0.32);
  }
  return onCylinder(r, [TABLE[0], GROUND, TABLE[2]], 0.05, TABLE[1] - GROUND);
};
const COLLEAGUES: readonly Vec3[] = [
  [TABLE[0] - 0.45, TABLE[1] + 0.14, TABLE[2] - 0.14],
  [TABLE[0], TABLE[1] + 0.16, TABLE[2] - 0.34],
  [TABLE[0] + 0.45, TABLE[1] + 0.14, TABLE[2] - 0.14],
];

export const PROFESSIONAL_SERVICES: IndustryLandmark = {
  parts: [
    { weight: 3, sample: (r) => onFacade(r, TOWER, 0.12, 0.1), order: rise(0.08, 0.46) },
    { weight: 1.3, sample: (r) => onFacade(r, WING, 0.13, 0.12), order: rise(0.1, 0.36) },
    { weight: 0.25, tag: 4, sample: clock, order: () => 0.4 },
    { weight: 1.6, sample: briefcase, order: rise(0.42, 0.52, GROUND, 0.9) },
    { weight: 0.15, tag: 3, sample: papers, order: () => 0.54 },
    { weight: 0.45, sample: table, order: rise(0.44, 0.5, GROUND, 0.35) },
    ...COLLEAGUES.map((at, i) => ({
      weight: 0.16,
      tag: 2,
      sample: (r: Random) => onPerson(r, at, 1.25),
      order: () => 0.56 + i * 0.02,
    })),
  ],
  draw: (lines) => {
    drawBlock(lines, TOWER, 0.08, 0.46);
    drawBlock(lines, WING, 0.1, 0.36);
  },
  icons: ["mail", "calendar", "document", "clock", "search", "chart"],
  anchors: [
    [-0.75, GROUND + 1.9, TOWER_FRONT],
    [TABLE[0], TABLE[1] + 0.05, TABLE[2] + 0.2],
    [CASE[0] - 0.2, CASE_TOP + 0.12, CASE[2]],
    [CLOCK[0] + 0.1, CLOCK[1], CLOCK[2]],
    [-0.9, GROUND + 0.85, TOWER_FRONT],
    [1.05, GROUND + 0.95, WING_FRONT],
  ],
};
