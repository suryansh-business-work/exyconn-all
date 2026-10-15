import { ICONS } from "./icons";
import {
  GROUND,
  onDrawing,
  onPolyline,
  ringPoints,
  rise,
  sweep,
  type IndustryLandmark,
} from "./kit";
import { circle, line } from "../../../../lib/detail/glyphs";
import { between, jitter, pickIndex, type Random, type Vec3 } from "../sampling";

/**
 * Fitness & sports: a gym floor. A running track's lanes ring the plinth; a big dumbbell
 * rests on its plates in front, a runner strides on a treadmill behind it, and a heart-rate
 * trace runs above them into a beating heart. Use cases: membership enquiries land at the
 * start of the trace, class bookings on the treadmill console, renewals on the dumbbell,
 * personal plans on the heart, churn alerts on the track and attendance at its far side.
 */
const LANES: readonly (readonly [number, number])[] = [
  [1.75, 1.06],
  [1.6, 0.95],
  [1.45, 0.84],
];
const DUMBBELL: Vec3 = [-0.4, GROUND + 0.44, 0.35];
const YAW = -0.35;
const PLATES: readonly (readonly [number, number])[] = [
  [-0.4, 0.42],
  [-0.5, 0.33],
  [0.4, 0.42],
  [0.5, 0.33],
];
const TREAD = { x0: 0.4, x1: 1.5, z: -0.5, half: 0.22, deck: GROUND + 0.14, top: GROUND + 1.02 };
const HR_Y = 0.25;
const HR_Z = -0.8;
const HEART: Vec3 = [1.3, HR_Y + 0.05, HR_Z];

const track = (r: Random): Vec3 => {
  const [rx, rz] = LANES[pickIndex(r, LANES.length)];
  return onPolyline(r, ringPoints([0, GROUND + 0.01, 0], rx, rz, 48), 0.006);
};

/** A point on the dumbbell, `along` its bar and `across` it, turned to show its plates. */
const onBar = (along: number, y: number, across: number): Vec3 => [
  DUMBBELL[0] + along * Math.cos(YAW) - across * Math.sin(YAW),
  DUMBBELL[1] + y,
  DUMBBELL[2] + along * Math.sin(YAW) + across * Math.cos(YAW),
];

/** The dumbbell: a bar through two pairs of plates, each a dotted disc with a rim. */
const dumbbell = (r: Random): Vec3 => {
  if (r() < 0.12) {
    return jitter(r, onBar(between(r, -0.62, 0.62), 0, 0), 0.012);
  }
  const [dx, radius] = PLATES[pickIndex(r, PLATES.length)];
  const angle = r() * Math.PI * 2;
  const ring = r() < 0.6 ? radius : radius * Math.sqrt(between(r, 0.04, 1));
  return onBar(dx + between(r, -0.035, 0.035), ring * Math.sin(angle), ring * Math.cos(angle));
};

/** The treadmill: belt deck, twin uprights, rails and a console. */
const treadmill = (r: Random): Vec3 => {
  const pick = r();
  const side = TREAD.z + (r() < 0.5 ? -TREAD.half : TREAD.half);
  if (pick < 0.45) {
    return [
      between(r, TREAD.x0, TREAD.x1 - 0.1),
      TREAD.deck,
      TREAD.z + between(r, -TREAD.half, TREAD.half),
    ];
  }
  if (pick < 0.85) {
    const frame: Vec3[] = [
      [TREAD.x0, GROUND, side],
      [TREAD.x0, TREAD.deck, side],
      [TREAD.x1, TREAD.deck, side],
      [TREAD.x1 - 0.05, TREAD.top, side],
      [TREAD.x1 - 0.45, TREAD.top - 0.25, side],
    ];
    return onPolyline(r, frame, 0.006);
  }
  return [
    between(r, TREAD.x1 - 0.25, TREAD.x1),
    TREAD.top + between(r, 0, 0.1),
    TREAD.z + between(r, -TREAD.half, TREAD.half),
  ];
};

/** A runner mid-stride facing the console. */
const RUNNER = [
  circle(0.2, 0.78, 0.16, 12),
  line([0.12, 0.6], [-0.05, 0]),
  line([-0.05, 0], [0.3, -0.4], [0.2, -0.95]),
  line([-0.05, 0], [-0.3, -0.45], [-0.6, -0.65]),
  line([0.08, 0.45], [0.35, 0.2], [0.55, 0.38]),
  line([0.08, 0.45], [-0.2, 0.25], [-0.35, 0.05]),
];

const runner = (r: Random): Vec3 => {
  const point = onDrawing(r, RUNNER, [0.8, TREAD.deck + 0.48, TREAD.z + 0.05], 0.48);
  return [point[0], point[1], point[2] + between(r, -0.03, 0.03)];
};

/** The heart-rate trace: flat, then a spike every beat. */
const HR: Vec3[] = [
  [-1.4, HR_Y, HR_Z],
  ...[-1.1, -0.3, 0.5].flatMap((x): Vec3[] => [
    [x, HR_Y, HR_Z],
    [x + 0.06, HR_Y - 0.08, HR_Z],
    [x + 0.12, HR_Y + 0.36, HR_Z],
    [x + 0.18, HR_Y - 0.18, HR_Z],
    [x + 0.24, HR_Y, HR_Z],
  ]),
  [HEART[0] - 0.18, HR_Y, HR_Z],
];

export const FITNESS: IndustryLandmark = {
  parts: [
    { weight: 1.2, sample: track, order: sweep(0.08, 0.2) },
    { weight: 1.8, sample: dumbbell, order: sweep(0.22, 0.36, -0.95, 1.1) },
    { weight: 1, sample: treadmill, order: rise(0.24, 0.4, GROUND, 1.2) },
    { weight: 0.35, sample: runner, order: () => 0.44 },
    { weight: 0.45, sample: (r) => onPolyline(r, HR, 0.006), order: sweep(0.48, 0.58, -1.4, 2.6) },
    {
      weight: 0.22,
      tag: 4,
      sample: (r) => onDrawing(r, ICONS.heart, HEART, 0.22),
      order: () => 0.6,
    },
  ],
  draw: (lines) => {
    lines.segment(onBar(-0.62, 0, 0), onBar(0.62, 0, 0), 0.22);
    lines.box(
      [(TREAD.x0 + TREAD.x1) / 2, TREAD.deck / 2 + GROUND / 2, TREAD.z],
      [TREAD.x1 - TREAD.x0, TREAD.deck - GROUND, TREAD.half * 2],
      0.24,
      0.3
    );
  },
  icons: ["chat", "calendar", "card", "heart", "bell", "chart"],
  anchors: [
    HR[0],
    [TREAD.x1 - 0.1, TREAD.top + 0.05, TREAD.z],
    onBar(-0.45, 0.25, 0),
    [HEART[0], HEART[1], HEART[2]],
    [-1.25, GROUND + 0.01, 0.59],
    [1.25, GROUND + 0.01, 0.59],
  ],
};
