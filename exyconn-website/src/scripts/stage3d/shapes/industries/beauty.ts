import { GROUND, onDisc, onDrawing, onPolyline, rise, type IndustryLandmark } from "./kit";
import { line, roundedRect } from "../../../../lib/detail/glyphs";
import type { GlyphPath } from "../glyph";
import {
  between,
  jitter,
  onCylinder,
  onSphere,
  pickIndex,
  type Random,
  type Vec3,
} from "../sampling";

/**
 * Beauty & wellness: a salon station. A styling chair, seen from behind, faces a tall oval
 * mirror ringed with bulbs on a dressing table; a hair dryer lies on the table, a shelf of
 * product bottles stands to the right and a lotus in a pot to the left. Use cases: bookings
 * land on the chair, reminders on the hair dryer, client preferences on the lotus,
 * memberships on the product shelf, reviews and photos on the mirror and stylist revenue at
 * the end of the dressing table.
 */
const MIRROR: Vec3 = [-0.05, -0.08, -0.6];
const MIRROR_R: readonly [number, number] = [0.5, 0.72];
const TABLE_Y = GROUND + 0.55;
const CHAIR: Vec3 = [-0.05, GROUND, 0.3];
const SHELF_X = [0.95, 1.55] as const;
const SHELF_Z = -0.45;
const SHELVES = [GROUND + 0.5, GROUND + 0.92];
const LOTUS: Vec3 = [-1.25, GROUND, 0.35];
const BULBS = 14;

const oval = (scale: number, angle: number): Vec3 => [
  MIRROR[0] + MIRROR_R[0] * scale * Math.cos(angle),
  MIRROR[1] + MIRROR_R[1] * scale * Math.sin(angle),
  MIRROR[2],
];

/** The mirror's double frame and its ring of bulbs. */
const mirror = (r: Random): Vec3 => {
  if (r() < 0.3) {
    const k = pickIndex(r, BULBS);
    return onSphere(r, 0.035, oval(1.16, (k / BULBS) * Math.PI * 2 + 0.1));
  }
  return jitter(r, oval(r() < 0.5 ? 1 : 1.07, r() * Math.PI * 2), 0.006);
};

/** The dressing table top and its four legs. */
const dressingTable = (r: Random): Vec3 => {
  if (r() < 0.65) {
    return [between(r, -0.85, 0.75), TABLE_Y, MIRROR[2] + between(r, -0.15, 0.2)];
  }
  const x = r() < 0.5 ? -0.8 : 0.7;
  const z = MIRROR[2] + (r() < 0.5 ? -0.12 : 0.17);
  return [x, between(r, GROUND, TABLE_Y), z];
};

/** The styling chair from behind: base, column, seat, arms and a tall rounded back. */
const chair = (r: Random): Vec3 => {
  const [x, , z] = CHAIR;
  const pick = r();
  if (pick < 0.15) {
    return onDisc(r, [x, GROUND + 0.02, z], 0.26);
  }
  if (pick < 0.22) {
    return onCylinder(r, [x, GROUND, z], 0.04, 0.3);
  }
  if (pick < 0.38) {
    return [x + between(r, -0.27, 0.27), GROUND + 0.38, z + between(r, -0.25, 0.2)];
  }
  if (pick < 0.5) {
    const side = x + (r() < 0.5 ? -0.3 : 0.3);
    return onPolyline(
      r,
      [
        [side, GROUND + 0.38, z - 0.22],
        [side, GROUND + 0.58, z - 0.2],
        [side, GROUND + 0.58, z + 0.18],
      ],
      0.005
    );
  }
  if (r() < 0.35) {
    return [x + between(r, -0.2, 0.2), between(r, GROUND + 0.52, GROUND + 0.9), z + 0.22];
  }
  return onDrawing(r, [roundedRect(-1, -1, 1, 1, 0.45)], [x, GROUND + 0.72, z + 0.22], 0.25);
};

const DRYER: GlyphPath[] = [
  roundedRect(-0.9, 0.05, 0.5, 0.75, 0.3),
  line([0.5, 0.2], [0.95, 0.15], [0.95, 0.65], [0.5, 0.6]),
  line([-0.55, 0.05], [-0.65, -0.85], [-0.3, -0.85], [-0.2, 0.05]),
];

/** Bottles of three heights on the two shelves, with their pumps. */
const bottle = (r: Random): Vec3 => {
  const shelf = pickIndex(r, SHELVES.length);
  const k = pickIndex(r, 4);
  const x = SHELF_X[0] + 0.1 + k * 0.13;
  const height = 0.16 + ((k + shelf) % 3) * 0.06;
  if (r() < 0.2) {
    return [x, SHELVES[shelf] + height + between(r, 0, 0.05), SHELF_Z];
  }
  return onCylinder(r, [x, SHELVES[shelf], SHELF_Z], 0.045, height);
};

const shelf = (r: Random): Vec3 => {
  if (r() < 0.6) {
    return [
      between(r, SHELF_X[0], SHELF_X[1]),
      SHELVES[pickIndex(r, SHELVES.length)],
      SHELF_Z + between(r, -0.1, 0.1),
    ];
  }
  return [SHELF_X[pickIndex(r, 2)], between(r, GROUND, SHELVES[1] + 0.3), SHELF_Z];
};

/** A lotus: a fan of pointed petals on a stem above a tapered pot. */
const PETALS: Vec3[][] = [-0.9, -0.45, 0, 0.45, 0.9].map((angle) => {
  const length = angle === 0 ? 0.36 : 0.3;
  return Array.from({ length: 13 }, (_, i) => {
    const t = i < 7 ? i / 6 : (12 - i) / 6;
    const side = i < 7 ? 1 : -1;
    const width = 0.075 * Math.sin(Math.PI * t) * side;
    const along = t * length;
    return [
      LOTUS[0] + along * Math.sin(angle) + width * Math.cos(angle),
      GROUND + 0.62 + along * Math.cos(angle) - width * Math.sin(angle),
      LOTUS[2] + 0.04 * Math.abs(angle),
    ];
  });
});

const lotus = (r: Random): Vec3 => {
  const pick = r();
  if (pick < 0.3) {
    const t = r();
    const angle = r() * Math.PI * 2;
    const radius = 0.13 + 0.06 * t;
    return [
      LOTUS[0] + radius * Math.cos(angle),
      GROUND + 0.3 * t,
      LOTUS[2] + radius * Math.sin(angle),
    ];
  }
  if (pick < 0.4) {
    return [LOTUS[0], between(r, GROUND + 0.3, GROUND + 0.62), LOTUS[2]];
  }
  return onPolyline(r, PETALS[pickIndex(r, PETALS.length)], 0.005);
};

export const BEAUTY: IndustryLandmark = {
  parts: [
    { weight: 0.7, sample: dressingTable, order: rise(0.08, 0.2, GROUND, 0.6) },
    { weight: 1.6, sample: mirror, order: rise(0.2, 0.42, GROUND + 0.5, 1.6) },
    { weight: 1.1, tag: 1, sample: chair, order: rise(0.24, 0.46, GROUND, 1) },
    { weight: 0.5, sample: shelf, order: rise(0.12, 0.3, GROUND, 1.3) },
    { weight: 0.55, tag: 4, sample: bottle, order: () => 0.5 },
    { weight: 0.55, tag: 3, sample: lotus, order: rise(0.3, 0.6, GROUND, 1) },
    {
      weight: 0.35,
      sample: (r) => onDrawing(r, DRYER, [0.5, TABLE_Y + 0.18, MIRROR[2] + 0.15], 0.22),
      order: () => 0.56,
    },
  ],
  draw: (lines) => {
    lines.box([SHELF_X[0] + 0.3, GROUND + 0.6, SHELF_Z], [0.6, 1.2, 0.2], 0.12, 0.3);
  },
  icons: ["calendar", "bell", "heart", "card", "star", "chart"],
  anchors: [
    [CHAIR[0] - 0.12, GROUND + 0.95, CHAIR[2] + 0.22],
    [0.55, TABLE_Y + 0.3, MIRROR[2] + 0.15],
    [LOTUS[0], GROUND + 0.75, LOTUS[2]],
    [SHELF_X[0] + 0.3, SHELVES[1] + 0.15, SHELF_Z],
    oval(1.07, Math.PI * 0.85),
    [0.72, TABLE_Y, MIRROR[2] + 0.2],
  ],
};
