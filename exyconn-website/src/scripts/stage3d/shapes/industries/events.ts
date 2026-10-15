import {
  GROUND,
  onDisc,
  onDrawing,
  onPerson,
  onPolyline,
  rise,
  sweep,
  type IndustryLandmark,
} from "./kit";
import { circle, line } from "../../../../lib/detail/glyphs";
import { between, jitter, onBox, pickIndex, type Random, type Vec3 } from "../sampling";

/**
 * Events & entertainment: a live show. A stage under a truss frame, three spotlights
 * throwing cones of light onto a performer at the mic, speaker stacks either side, a crowd
 * with hands in the air out front and an entry arch where guests check in. Use cases:
 * ticketing lands on the truss, attendee questions on the crowd, promotion on the left
 * speakers, run-of-show on the right of the truss, check-in at the entry arch and post-event
 * reports on the right speakers.
 */
const STAGE: Vec3 = [0, GROUND + 0.15, -0.5];
const STAGE_SIZE: Vec3 = [2.3, 0.3, 0.8];
const DECK_Y = GROUND + 0.3;
const TRUSS_X = 1.05;
const TRUSS_TOP = GROUND + 2.2;
const TRUSS_Z = -0.5;
const SECTION = 0.07;
const SPOTS = [-0.6, 0, 0.6];
const SPEAKER_X = 1.48;
const SPEAKER_Z = -0.2;
const GATE: Vec3 = [-1.3, GROUND, 0.75];
const CROWD: readonly Vec3[] = [
  ...[-0.85, -0.42, 0, 0.42, 0.85].map((x, i): Vec3 => [x, GROUND + 0.45, 0.35 + (i % 2) * 0.06]),
  ...[-0.62, -0.2, 0.22, 0.64, 1.02].map((x, i): Vec3 => [x, GROUND + 0.38, 0.8 - (i % 2) * 0.06]),
];

/** The truss: two towers and a beam, each four chords braced by a zigzag. */
const TRUSS_RUNS: readonly [Vec3, Vec3][] = [
  [
    [-TRUSS_X, DECK_Y, TRUSS_Z],
    [-TRUSS_X, TRUSS_TOP, TRUSS_Z],
  ],
  [
    [TRUSS_X, DECK_Y, TRUSS_Z],
    [TRUSS_X, TRUSS_TOP, TRUSS_Z],
  ],
  [
    [-TRUSS_X, TRUSS_TOP, TRUSS_Z],
    [TRUSS_X, TRUSS_TOP, TRUSS_Z],
  ],
];

const truss = (r: Random): Vec3 => {
  const [a, b] = TRUSS_RUNS[pickIndex(r, TRUSS_RUNS.length)];
  const vertical = a[0] === b[0];
  const t = r();
  const corner = pickIndex(r, 4);
  const zig = r() < 0.4;
  const phase = (t * 14) % 1;
  const u = zig ? Math.abs(phase * 2 - 1) * 2 - 1 : (corner % 2) * 2 - 1;
  const w = corner < 2 ? -1 : 1;
  const x = a[0] + (b[0] - a[0]) * t + (vertical ? u * SECTION : 0);
  const y = a[1] + (b[1] - a[1]) * t + (vertical ? 0 : u * SECTION);
  return jitter(r, [x, y, TRUSS_Z + w * SECTION], 0.004);
};

/** A spotlight can under the beam and its cone of light down to a pool on the deck. */
const spotlight = (r: Random): Vec3 => {
  const x = SPOTS[pickIndex(r, SPOTS.length)];
  const apex: Vec3 = [x, TRUSS_TOP - 0.14, TRUSS_Z + 0.05];
  const pool: Vec3 = [x * 0.5, DECK_Y + 0.01, STAGE[2] + 0.15];
  const pick = r();
  if (pick < 0.15) {
    return onBox(r, [x, TRUSS_TOP - 0.1, TRUSS_Z + 0.05], [0.1, 0.12, 0.1]);
  }
  if (pick < 0.35) {
    return onDisc(r, pool, 0.22);
  }
  const angle = r() * Math.PI * 2;
  const t = r() ** 0.7;
  return [
    apex[0] + (pool[0] + 0.22 * Math.cos(angle) - apex[0]) * t,
    apex[1] + (pool[1] - apex[1]) * t,
    apex[2] + (pool[2] + 0.22 * Math.sin(angle) - apex[2]) * t,
  ];
};

const CONES = [circle(0, -0.25, 0.5, 18), circle(0, -0.25, 0.2, 10), circle(0, 0.6, 0.18, 10)];

/** A speaker stack: two cabinets, each with a woofer and a tweeter facing the crowd. */
const speakers =
  (side: number) =>
  (r: Random): Vec3 => {
    const x = side * SPEAKER_X;
    const cabinet = pickIndex(r, 2);
    const centre: Vec3 = [x, GROUND + 0.21 + cabinet * 0.42, SPEAKER_Z];
    if (r() < 0.55) {
      return onBox(r, centre, [0.38, 0.4, 0.3]);
    }
    return onDrawing(r, CONES, [x, centre[1], SPEAKER_Z + 0.16], 0.17);
  };

/** The singer's body and legs, and the mic stand in front. */
const SINGER = [
  line([0, 0.65], [0, -0.2], [-0.22, -1]),
  line([0, -0.2], [0.22, -1]),
  line([0.4, -1], [0.4, 0.75], [0.15, 1]),
];

const performer = (r: Random): Vec3 => {
  if (r() < 0.4) {
    return onPerson(r, [0, DECK_Y + 0.62, STAGE[2] + 0.1], 1.4);
  }
  return onDrawing(r, SINGER, [0, DECK_Y + 0.31, STAGE[2] + 0.15], 0.31);
};

/** The crowd: heads and shoulders, every third fan with both hands up. */
const crowd = (r: Random): Vec3 => {
  const index = pickIndex(r, CROWD.length);
  const at = CROWD[index];
  if (index % 3 === 0 && r() < 0.35) {
    const side = r() < 0.5 ? -1 : 1;
    const [x, y, z] = at;
    return onPolyline(r, [
      [x + side * 0.13, y - 0.06, z],
      [x + side * 0.21, y + 0.34, z],
    ]);
  }
  return onPerson(r, at, 1.6);
};

/** The entry arch: two posts and a banner, where tickets are scanned. */
const gate = (r: Random): Vec3 => {
  const [x, , z] = GATE;
  if (r() < 0.45) {
    const post = x + (r() < 0.5 ? -0.24 : 0.24);
    return [post, between(r, GROUND, GROUND + 0.62), z];
  }
  return jitter(r, [x + between(r, -0.3, 0.3), between(r, GROUND + 0.55, GROUND + 0.72), z], 0.01);
};

export const EVENTS: IndustryLandmark = {
  parts: [
    { weight: 1.3, sample: (r) => onBox(r, STAGE, STAGE_SIZE), order: sweep(0.08, 0.18) },
    { weight: 1.4, sample: truss, order: rise(0.18, 0.36, DECK_Y, 1.9) },
    { weight: 0.9, sample: spotlight, order: rise(0.5, 0.4, DECK_Y, 1.9) },
    { weight: 0.55, tag: 3, sample: speakers(-1), order: rise(0.2, 0.3, GROUND, 0.85) },
    { weight: 0.55, sample: speakers(1), order: rise(0.22, 0.32, GROUND, 0.85) },
    { weight: 0.3, sample: performer, order: () => 0.52 },
    { weight: 1.2, tag: 2, sample: crowd, order: sweep(0.54, 0.62, -1, 2) },
    { weight: 0.25, tag: 5, sample: gate, order: () => 0.48 },
  ],
  draw: (lines) => {
    lines.box(STAGE, STAGE_SIZE, 0.08, 0.18);
    TRUSS_RUNS.forEach(([a, b], i) => lines.segment(a, b, 0.2 + i * 0.06));
  },
  icons: ["ticket", "chat", "megaphone", "calendar", "check", "chart"],
  anchors: [
    [-0.7, TRUSS_TOP, TRUSS_Z],
    [0.64, GROUND + 0.55, 0.74],
    [-SPEAKER_X, GROUND + 0.84, SPEAKER_Z],
    [TRUSS_X, TRUSS_TOP - 0.4, TRUSS_Z],
    [GATE[0], GROUND + 0.7, GATE[2]],
    [SPEAKER_X, GROUND + 0.45, SPEAKER_Z + 0.15],
  ],
};
