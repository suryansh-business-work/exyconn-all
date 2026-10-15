import { ICONS } from "./icons";
import {
  drawBlock,
  GROUND,
  onDrawing,
  onFacade,
  onPolyline,
  rise,
  type Block,
  type IndustryLandmark,
} from "./kit";
import { between, onBox, onTriangle, pickIndex, type Random, type Vec3 } from "../sampling";

/**
 * Real estate: a property for sale. A family house with a pitched roof, a chimney and a
 * fenced plot stands at the front left under a big map pin, a residential tower with a
 * balcony on every floor rises behind it on the right, and a "for sale" board hangs from its
 * post at the gate. Use cases: portal leads land on the board, lead qualification on the
 * tower's upper floors, site visits on the pin, listings and tours on the tower's windows,
 * handover at the house's front door and inventory reports on the tower's roof.
 */
const TOWER: Block = [0.85, -0.5, 0.75, 0.55, 2.3];
const TOWER_FRONT = TOWER[1] + TOWER[3] / 2;
const HOUSE: Block = [-0.55, 0.1, 0.9, 0.65, 0.5];
const HOUSE_FRONT = HOUSE[1] + HOUSE[3] / 2;
const EAVES = GROUND + HOUSE[4];
const RIDGE = EAVES + 0.42;
const HALF = HOUSE[2] / 2 + 0.06;
/** The plot's boundary pegged out on the ground round the house. */
const PLOT: Vec3[] = [
  [-1.15, GROUND, -0.35],
  [0.05, GROUND, -0.35],
  [0.05, GROUND, 0.75],
  [-1.15, GROUND, 0.75],
  [-1.15, GROUND, -0.35],
];
const PIN: Vec3 = [HOUSE[0], RIDGE + 0.5, HOUSE[1]];
const SIGN: Vec3 = [-1.38, GROUND + 0.55, 0.75];
const DOOR: Vec3 = [HOUSE[0], GROUND + 0.16, HOUSE_FRONT + 0.005];

/** Two roof slopes, ridge running front to back, overhanging the walls a little. */
const roof = (r: Random): Vec3 => {
  const side = r() < 0.5 ? -1 : 1;
  const t = r();
  const z = between(r, HOUSE[1] - HOUSE[3] / 2 - 0.05, HOUSE_FRONT + 0.05);
  return [HOUSE[0] + side * HALF * (1 - t), EAVES - 0.04 + t * (RIDGE - EAVES + 0.04), z];
};

/** The gable's triangle on the front wall, a door and two windows under it. */
const front = (r: Random): Vec3 => {
  const z = HOUSE_FRONT + 0.005;
  const pick = r();
  if (pick < 0.4) {
    return onTriangle(
      r,
      [HOUSE[0] - HOUSE[2] / 2, EAVES, z],
      [HOUSE[0] + HOUSE[2] / 2, EAVES, z],
      [HOUSE[0], RIDGE, z]
    );
  }
  if (pick < 0.7) {
    return onPolyline(
      r,
      [
        [DOOR[0] - 0.08, GROUND, z],
        [DOOR[0] - 0.08, GROUND + 0.3, z],
        [DOOR[0] + 0.08, GROUND + 0.3, z],
        [DOOR[0] + 0.08, GROUND, z],
      ],
      0.005
    );
  }
  const x = HOUSE[0] + (r() < 0.5 ? -0.28 : 0.28);
  return onBox(r, [x, GROUND + 0.28, z], [0.16, 0.14, 0.001]);
};

/** The sign: its post and arm, and the board hanging from it with a line of lettering. */
const sign = (r: Random): Vec3 => {
  const post = SIGN[0] - 0.24;
  if (r() < 0.3) {
    return onPolyline(
      r,
      [
        [post, GROUND, SIGN[2]],
        [post, SIGN[1] + 0.2, SIGN[2]],
        [SIGN[0] + 0.2, SIGN[1] + 0.2, SIGN[2]],
      ],
      0.006
    );
  }
  const lettering = pickIndex(r, 3);
  if (r() < 0.5) {
    return [SIGN[0] + between(r, -0.13, 0.13), SIGN[1] + 0.04 - lettering * 0.05, SIGN[2]];
  }
  return onBox(r, SIGN, [0.36, 0.22, 0.001]);
};

/** A balcony ledge across the tower's front on every floor. */
const balconies = (r: Random): Vec3 => {
  const floor = 1 + pickIndex(r, 14);
  const y = GROUND + floor * (TOWER[4] / 15);
  return [TOWER[0] + between(r, -0.33, 0.33), y, TOWER_FRONT + between(r, 0, 0.08)];
};

export const REAL_ESTATE: IndustryLandmark = {
  parts: [
    { weight: 2.5, sample: (r) => onFacade(r, TOWER, 0.153, 0.125), order: rise(0.1, 0.46) },
    { weight: 0.6, sample: balconies, order: rise(0.12, 0.48) },
    {
      weight: 0.7,
      sample: (r) => onFacade(r, HOUSE, 0.17, 0.2),
      order: rise(0.08, 0.16, GROUND, 0.5),
    },
    { weight: 0.8, sample: roof, order: () => 0.22 },
    { weight: 0.45, sample: front, order: () => 0.26 },
    {
      weight: 0.1,
      sample: (r) => onBox(r, [HOUSE[0] - 0.25, RIDGE - 0.08, HOUSE[1]], [0.1, 0.24, 0.1]),
      order: () => 0.28,
    },
    { weight: 0.3, tag: 1, sample: sign, order: () => 0.52 },
    { weight: 0.35, tag: 3, sample: (r) => onDrawing(r, ICONS.pin, PIN, 0.3), order: () => 0.6 },
  ],
  draw: (lines) => {
    drawBlock(lines, TOWER, 0.1, 0.46);
    drawBlock(lines, HOUSE, 0.08, 0.16);
    const back = HOUSE[1] - HOUSE[3] / 2 - 0.05;
    const fore = HOUSE_FRONT + 0.05;
    [back, fore].forEach((z) => {
      lines.path(
        [
          [HOUSE[0] - HALF, EAVES - 0.04, z],
          [HOUSE[0], RIDGE, z],
          [HOUSE[0] + HALF, EAVES - 0.04, z],
        ],
        0.18,
        0.24
      );
    });
    lines.segment([HOUSE[0], RIDGE, back], [HOUSE[0], RIDGE, fore], 0.24);
    lines.path(PLOT, 0.08, 0.14);
  },
  icons: ["chat", "search", "calendar", "document", "key", "chart"],
  anchors: [
    [SIGN[0] - 0.05, SIGN[1], SIGN[2]],
    [TOWER[0] + 0.3, GROUND + 1.85, TOWER_FRONT],
    [PIN[0], PIN[1] - 0.25, PIN[2]],
    [TOWER[0] + 0.3, GROUND + 0.9, TOWER_FRONT],
    [DOOR[0], DOOR[1], DOOR[2]],
    [TOWER[0] + TOWER[2] / 2, GROUND + TOWER[4], TOWER_FRONT],
  ],
};
