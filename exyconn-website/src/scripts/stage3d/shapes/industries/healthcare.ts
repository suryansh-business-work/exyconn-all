import {
  drawBlock,
  GROUND,
  onDrawing,
  onFacade,
  onPerson,
  onPolyline,
  rise,
  sweep,
  type Block,
  type IndustryLandmark,
} from "./kit";
import { circle, line } from "../../../../lib/detail/glyphs";
import { between, jitter, pickIndex, type Random, type Vec3 } from "../sampling";

/**
 * Healthcare: a clinic. A two-storey building of lit windows wears a big medical cross on
 * its roof, a heartbeat trace runs across its front, and outside a doctor in a white coat
 * wheels a patient in a wheelchair. Use cases: appointments land on the cross, patient
 * queries on the patient, intake records on the left wing, lab reports on the right wing,
 * billing at the entrance and clinic analytics at the end of the heartbeat.
 */
const CLINIC: Block = [0, -0.55, 2, 0.6, 1.25];
const FRONT_Z = CLINIC[1] + CLINIC[3] / 2;
const ROOF_Y = GROUND + CLINIC[4];
const CROSS: Vec3 = [0, ROOF_Y + 0.38, FRONT_Z - 0.15];
const ECG_Y = GROUND + 0.78;
const ECG_Z = 0.2;
const CHAIR: Vec3 = [0.95, GROUND, 0.62];
const DOOR = { x0: -0.18, x1: 0.18, y1: GROUND + 0.55 };

/** One beat: flat, a small P wave, the QRS spike, a T wave. */
const beat = (x: number): Vec3[] =>
  [
    [0, 0],
    [0.1, 0],
    [0.14, 0.05],
    [0.18, 0],
    [0.24, 0],
    [0.27, -0.08],
    [0.31, 0.38],
    [0.35, -0.2],
    [0.39, 0],
    [0.46, 0],
    [0.52, 0.09],
    [0.58, 0],
  ].map(([dx, dy]): Vec3 => [x + dx, ECG_Y + dy, ECG_Z]);

const ECG: Vec3[] = [
  [-1.62, ECG_Y, ECG_Z],
  ...beat(-1.3),
  ...beat(-0.4),
  ...beat(0.5),
  [1.55, ECG_Y, ECG_Z],
];

/** Lit windows, leaving the entrance clear. */
const facade = (r: Random): Vec3 => {
  for (;;) {
    const point = onFacade(r, CLINIC, 0.16, 0.15);
    const inDoor = point[0] > DOOR.x0 - 0.05 && point[0] < DOOR.x1 + 0.05 && point[1] < DOOR.y1;
    if (!inDoor) {
      return point;
    }
  }
};

/** The roof cross, a solid plus of dots with some depth. */
const cross = (r: Random): Vec3 => {
  const vertical = r() < 0.5;
  const long = between(r, -0.3, 0.3);
  const short = between(r, -0.1, 0.1);
  const [dx, dy] = vertical ? [short, long] : [long, short];
  return jitter(r, [CROSS[0] + dx, CROSS[1] + dy, CROSS[2] + between(r, -0.04, 0.04)], 0.004);
};

/** The wheelchair in profile, facing left, with its patient. */
const WHEELCHAIR = [
  circle(0, -0.55, 0.45, 20),
  circle(-0.7, -0.88, 0.12, 8),
  line([-0.7, -0.76], [-0.55, -0.3], [0.15, -0.3], [0.25, 0.45], [0.45, 0.5]),
  line([-0.55, -0.3], [-0.8, -0.65], [-0.95, -0.65]),
];

const wheelchair = (r: Random): Vec3 => {
  if (r() < 0.3) {
    return onPerson(r, [CHAIR[0] - 0.05, GROUND + 0.62, CHAIR[2]], 1.2);
  }
  const point = onDrawing(r, WHEELCHAIR, [CHAIR[0], GROUND + 0.5, CHAIR[2]], 0.5);
  return [point[0], point[1], point[2] + (r() < 0.5 ? -0.08 : 0.08)];
};

/** The doctor standing behind the chair: head and shoulders over a long open coat. */
const doctor = (r: Random): Vec3 => {
  const [x, , z] = [CHAIR[0] + 0.45, 0, CHAIR[2] - 0.05];
  if (r() < 0.35) {
    return onPerson(r, [x, GROUND + 0.95, z], 1.3);
  }
  const coat: Vec3[][] = [
    [
      [x - 0.12, GROUND + 0.88, z],
      [x - 0.16, GROUND + 0.3, z],
      [x + 0.16, GROUND + 0.3, z],
      [x + 0.12, GROUND + 0.88, z],
    ],
    [
      [x, GROUND + 0.85, z + 0.02],
      [x, GROUND + 0.3, z + 0.02],
    ],
    [
      [x - 0.07, GROUND + 0.3, z],
      [x - 0.07, GROUND, z],
    ],
    [
      [x + 0.07, GROUND + 0.3, z],
      [x + 0.07, GROUND, z],
    ],
  ];
  return onPolyline(r, coat[pickIndex(r, coat.length)], 0.006);
};

export const HEALTHCARE: IndustryLandmark = {
  parts: [
    { weight: 3, sample: facade, order: rise(0.08, 0.36, GROUND, CLINIC[4]) },
    { weight: 0.5, sample: cross, order: () => 0.42 },
    {
      weight: 0.55,
      tag: 6,
      sample: (r) => onPolyline(r, ECG, 0.006),
      order: sweep(0.46, 0.6, -1.62, 3.2),
    },
    { weight: 0.45, tag: 2, sample: wheelchair, order: rise(0.5, 0.58, GROUND, 0.8) },
    { weight: 0.35, sample: doctor, order: rise(0.52, 0.62, GROUND, 1.05) },
  ],
  draw: (lines) => {
    drawBlock(lines, CLINIC, 0.08, 0.36);
    lines.path(
      [
        [DOOR.x0, GROUND, FRONT_Z],
        [DOOR.x0, DOOR.y1, FRONT_Z],
        [DOOR.x1, DOOR.y1, FRONT_Z],
        [DOOR.x1, GROUND, FRONT_Z],
      ],
      0.2,
      0.26
    );
    lines.segment([0, ROOF_Y, CROSS[2]], [0, CROSS[1] - 0.3, CROSS[2]], 0.38);
  },
  icons: ["calendar", "chat", "document", "bell", "card", "chart"],
  anchors: [
    [CROSS[0] - 0.12, CROSS[1], CROSS[2]],
    [CHAIR[0] - 0.05, GROUND + 0.62, CHAIR[2]],
    [-0.6, GROUND + 1.05, FRONT_Z],
    [0.6, GROUND + 1.05, FRONT_Z],
    [DOOR.x0, GROUND + 0.35, FRONT_Z],
    [ECG[ECG.length - 1][0], ECG_Y, ECG_Z],
  ],
};
