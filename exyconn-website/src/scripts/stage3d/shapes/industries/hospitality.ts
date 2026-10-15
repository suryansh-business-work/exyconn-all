import { ICONS } from "./icons";
import {
  drawBlock,
  GROUND,
  onDrawing,
  onFacade,
  onPerson,
  onPolyline,
  rise,
  ringPoints,
  type Block,
  type IndustryLandmark,
} from "./kit";
import { arc } from "../../../../lib/detail/glyphs";
import { between, type Vec3 } from "../sampling";

/**
 * Hospitality: a hotel. A tower of lit rooms rises from a wide lobby podium with a canopy over
 * the entrance and guests arriving under it; a pool sits to one side and two palms to the
 * other, and five stars crown the roof. Use cases: guest messaging lands on the entrance,
 * bookings on the front desk, reviews on the stars, housekeeping on the room floors, upsells
 * at the pool and revenue reports in the back office.
 */
const TOWER: Block = [-0.15, -0.45, 1.15, 0.6, 2.35];
const PODIUM: Block = [0, 0.15, 2, 0.6, 0.5];
const CANOPY_Y = GROUND + 0.5;
const ROOF_Y = GROUND + TOWER[4];
const POOL: Vec3 = [-1.2, GROUND, 0.9];

const canopy = (r: () => number): Vec3 => [
  between(r, -0.55, 0.55),
  CANOPY_Y + 0.02,
  between(r, 0.45, 0.85),
];

const stars = (r: () => number): Vec3 => {
  const k = Math.floor(r() * 5);
  return onDrawing(r, ICONS.star, [-0.6 + k * 0.225, ROOF_Y + 0.2, TOWER[1] + 0.3], 0.09);
};

const pool = (r: () => number): Vec3 => {
  if (r() < 0.55) {
    return onPolyline(r, ringPoints(POOL, 0.42, 0.22, 28), 0.006);
  }
  const wave = Math.floor(r() * 3);
  const x = between(r, -0.3, 0.3);
  return [POOL[0] + x, GROUND + 0.01, POOL[2] - 0.1 + wave * 0.1 + 0.025 * Math.sin(x * 18)];
};

const palm =
  (base: Vec3) =>
  (r: () => number): Vec3 => {
    const top: Vec3 = [base[0] + 0.08, GROUND + 0.95, base[2]];
    if (r() < 0.35) {
      return onPolyline(r, [base, [base[0] + 0.05, GROUND + 0.5, base[2]], top], 0.008);
    }
    const frond = Math.floor(r() * 5);
    const curve = arc(0, 0, 0.32, Math.PI * 0.15, Math.PI * 0.85, 8);
    const angle = (frond / 5) * Math.PI * 2;
    const points = curve.map(([x, y]): Vec3 => [
      top[0] + (x * Math.cos(angle)) / 1.2,
      top[1] + y - 0.25,
      top[2] + (x * Math.sin(angle)) / 1.2,
    ]);
    return onPolyline(r, points, 0.006);
  };

const GUESTS: readonly Vec3[] = [
  [-0.3, GROUND + 0.1, 0.75],
  [0.05, GROUND + 0.1, 0.8],
  [0.32, GROUND + 0.1, 0.72],
];

export const HOSPITALITY: IndustryLandmark = {
  parts: [
    { weight: 3.2, sample: (r) => onFacade(r, TOWER), order: rise(0.1, 0.5) },
    { weight: 1.2, sample: (r) => onFacade(r, PODIUM, 0.16, 0.16), order: rise(0.08, 0.18) },
    { weight: 0.35, sample: canopy, order: () => 0.24 },
    { weight: 0.3, tag: 3, sample: stars, order: () => 0.56 },
    { weight: 0.45, sample: pool, order: () => 0.3 },
    { weight: 0.25, sample: palm([1.5, GROUND, 0.75]), order: rise(0.3, 0.42) },
    { weight: 0.22, sample: palm([1.95, GROUND, 0.2]), order: rise(0.32, 0.44) },
    ...GUESTS.map((at, i) => ({
      weight: 0.12,
      tag: 1,
      sample: (r: () => number) => onPerson(r, at, 0.9),
      order: () => 0.58 + i * 0.01,
    })),
  ],
  draw: (lines) => {
    drawBlock(lines, PODIUM, 0.08, 0.18);
    drawBlock(lines, TOWER, 0.12, 0.5);
    lines.path(
      [
        [-0.55, CANOPY_Y, 0.45],
        [-0.55, CANOPY_Y, 0.85],
        [0.55, CANOPY_Y, 0.85],
        [0.55, CANOPY_Y, 0.45],
      ],
      0.22,
      0.26
    );
    lines.segment([-0.55, GROUND, 0.85], [-0.55, CANOPY_Y, 0.85], 0.22);
    lines.segment([0.55, GROUND, 0.85], [0.55, CANOPY_Y, 0.85], 0.22);
  },
  icons: ["chat", "calendar", "star", "bell", "key", "chart"],
  anchors: [
    [-0.3, CANOPY_Y, 0.85],
    [0.75, GROUND + 0.35, PODIUM[1] + 0.3],
    [-0.6, ROOF_Y + 0.2, TOWER[1] + 0.3],
    [0.42, GROUND + 1.5, TOWER[1] + 0.3],
    [POOL[0] - 0.3, GROUND + 0.05, POOL[2]],
    [0.95, GROUND + 0.15, PODIUM[1] + 0.3],
  ],
};
