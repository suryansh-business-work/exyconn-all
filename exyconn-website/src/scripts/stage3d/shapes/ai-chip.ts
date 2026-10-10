import { createLines, type LineBuilder } from "./lines";
import {
  between,
  clampCount,
  fillCloud,
  inSphere,
  jitter,
  onBox,
  pickIndex,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Services: an AI processor at the heart of a circuit board, every service wired to it. A
 * raised chip — package, die and a 4×4 array of glowing cores — sits on a board ruled by a
 * faint grid, a hologram rising off it; from the chip one trace per service runs out across
 * the board, PCB style (straight, then a 45° bend), to that service's pad, with packets
 * running out along it. Built as a story: the board, the chip, its cores, the hologram, then
 * each trace drawing out to its pad.
 *
 * The board, the chip and the hologram are tag 0; trace `i` and pad `i` are tag `i + 1`, so a
 * service card lights its own route.
 */
export interface AiChipParams {
  pads?: number;
}

export const AI_CHIP_BOUNDS: Vec3 = [2.6, 1.25, 1.65];

const MAX_PADS = 12;
const BOARD: readonly [number, number] = [2.5, 1.55];
const GRID_STEP = 0.5;
/** Where the pads sit: round a rectangle inside the board. */
const PAD_RING: readonly [number, number] = [2.12, 1.22];
const PACKAGE_HALF = 0.62;
const PACKAGE_HEIGHT = 0.06;
const DIE_HALF = 0.46;
const DIE_TOP = 0.2;
const CORES = 4;
const PINS_PER_SIDE = 9;
const PIN_LENGTH = 0.12;
const PAD_HALF = 0.17;
const PAD_HEIGHT = 0.07;
/** A trace's first leg leaves the chip at least this far before it bends. */
const BEND_CLEAR = 0.8;
const TRACE_Y = 0.004;
const SIBLING_GAP = 0.08;
const HOLO_BASE = DIE_TOP + 0.02;
const HOLO_TOP = 0.95;
const SPARK_RADIUS = 0.15;
const TAU = Math.PI * 2;

type Side = "left" | "right" | "front" | "back";

interface Route {
  pad: Vec3;
  side: Side;
  points: Vec3[];
}

/** Pad `index` of `total`, spread evenly round the pad ring, starting top left, clockwise. */
const padPosition = (index: number, total: number): { pad: Vec3; side: Side } => {
  const [w, d] = PAD_RING;
  const perimeter = 4 * (w + d);
  let along = ((index + 0.5) / total) * perimeter;
  if (along < 2 * w) {
    return { pad: [-w + along, 0, -d], side: "back" };
  }
  along -= 2 * w;
  if (along < 2 * d) {
    return { pad: [w, 0, -d + along], side: "right" };
  }
  along -= 2 * d;
  if (along < 2 * w) {
    return { pad: [w - along, 0, d], side: "front" };
  }
  along -= 2 * w;
  return { pad: [-w, 0, d - along], side: "left" };
};

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

/**
 * The trace from the chip to a pad: out of the chip's nearest side, straight, then a 45°
 * bend onto the pad. `shift` slides the whole route sideways, for the sibling traces.
 */
const route = (index: number, total: number, shift = 0): Route => {
  const { pad, side } = padPosition(index, total);
  const sideways = side === "left" || side === "right";
  // Work in (out, across): `out` points away from the chip, `across` runs along its side.
  const sign = side === "left" || side === "back" ? -1 : 1;
  const padOut = sideways ? pad[0] : pad[2];
  const padAcross = (sideways ? pad[2] : pad[0]) + shift;
  const startAcross = clamp(padAcross * 0.3, PACKAGE_HALF - 0.12);
  const bendOut = sign * Math.max(BEND_CLEAR, Math.abs(padOut) - Math.abs(padAcross - startAcross));
  const toWorld = (out: number, across: number): Vec3 =>
    sideways ? [out, TRACE_Y, across] : [across, TRACE_Y, out];
  return {
    pad,
    side,
    points: [
      toWorld(sign * PACKAGE_HALF, startAcross),
      toWorld(bendOut, startAcross),
      toWorld(padOut, padAcross),
    ],
  };
};

/** A point on a polyline, uniform along its length. */
const onPolyline = (random: Random, points: readonly Vec3[]): Vec3 => {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - points[i][0], p[2] - points[i][2]));
  let at = random() * lengths.reduce((sum, length) => sum + length, 0);
  let i = 0;
  while (i < lengths.length - 1 && at > lengths[i]) {
    at -= lengths[i];
    i += 1;
  }
  const t = Math.min(1, at / lengths[i]);
  const [a, b] = [points[i], points[i + 1]];
  return [a[0] + (b[0] - a[0]) * t, TRACE_Y, a[2] + (b[2] - a[2]) * t];
};

/** How far along its trace a point is, 0 at the chip to 1 at the pad (by distance out). */
const progress = (point: Vec3, trace: Route): number => {
  const start = trace.points[0];
  const reach = Math.hypot(trace.pad[0] - start[0], trace.pad[2] - start[2]);
  return Math.min(1, Math.hypot(point[0] - start[0], point[2] - start[2]) / reach);
};

/** A point on the die's top, crowded into its array of cores. */
const onDie = (random: Random): Vec3 => {
  const cell = (2 * DIE_HALF) / CORES;
  if (random() < 0.8) {
    const cx = -DIE_HALF + (pickIndex(random, CORES) + 0.5) * cell;
    const cz = -DIE_HALF + (pickIndex(random, CORES) + 0.5) * cell;
    const size = cell * 0.36;
    return [cx + between(random, -size, size), DIE_TOP, cz + between(random, -size, size)];
  }
  return onBox(
    random,
    [0, (PACKAGE_HEIGHT + DIE_TOP) / 2, 0],
    [2 * DIE_HALF, DIE_TOP - PACKAGE_HEIGHT, 2 * DIE_HALF]
  );
};

/** A point on one of the pins round the package's edge. */
const onPin = (random: Random): Vec3 => {
  const side = pickIndex(random, 4);
  const across =
    -PACKAGE_HALF + ((pickIndex(random, PINS_PER_SIDE) + 0.5) * 2 * PACKAGE_HALF) / PINS_PER_SIDE;
  const out = PACKAGE_HALF + random() * PIN_LENGTH;
  const sign = side < 2 ? -1 : 1;
  return side % 2 === 0 ? [sign * out, TRACE_Y, across] : [across, TRACE_Y, sign * out];
};

/** The hologram: a cone of light off the die, narrowing to a spark of light at its tip. */
const onHologram = (random: Random): Vec3 => {
  if (random() < 0.45) {
    return inSphere(random, SPARK_RADIUS, [0, HOLO_TOP, 0]);
  }
  const t = random() ** 1.6;
  const radius = (1 - t) * DIE_HALF * 0.8 + t * SPARK_RADIUS * 0.4;
  const angle = random() * TAU;
  return [
    radius * Math.cos(angle),
    HOLO_BASE + t * (HOLO_TOP - HOLO_BASE),
    radius * Math.sin(angle),
  ];
};

const boardParts = (): Part[] => [
  {
    weight: 0.5,
    sample: (r) => [between(r, -BOARD[0], BOARD[0]), 0, between(r, -BOARD[1], BOARD[1])],
    order: (p) => 0.06 * ((p[0] + BOARD[0]) / (2 * BOARD[0])),
  },
  {
    weight: 0.7,
    sample: (r) =>
      onBox(r, [0, PACKAGE_HEIGHT / 2, 0], [2 * PACKAGE_HALF, PACKAGE_HEIGHT, 2 * PACKAGE_HALF]),
    order: () => 0.08,
  },
  { weight: 2.2, sample: onDie, order: (p) => 0.1 + 0.12 * (p[1] / DIE_TOP) },
  { weight: 0.6, sample: onPin, order: () => 0.2 },
  {
    weight: 1.1,
    sample: onHologram,
    order: (p) => 0.26 + 0.1 * ((p[1] - HOLO_BASE) / (HOLO_TOP - HOLO_BASE)),
  },
];

/** Service `index`: its trace, a quieter sibling beside it, and its pad. */
const serviceParts = (index: number, total: number): Part[] => {
  const trace = route(index, total);
  const sibling = route(index, total, SIBLING_GAP);
  const tag = index + 1;
  const start = 0.38 + (index / total) * 0.22;
  return [
    {
      weight: 0.55,
      tag,
      sample: (r) => jitter(r, onPolyline(r, trace.points), 0.006),
      order: (p) => start + 0.14 * progress(p, trace),
    },
    {
      weight: 0.18,
      sample: (r) => jitter(r, onPolyline(r, sibling.points), 0.005),
      order: (p) => start + 0.02 + 0.14 * progress(p, sibling),
    },
    {
      weight: 0.5,
      tag,
      sample: (r) =>
        onBox(
          r,
          [trace.pad[0], PAD_HEIGHT / 2, trace.pad[2]],
          [2 * PAD_HALF, PAD_HEIGHT, 2 * PAD_HALF]
        ),
      order: () => start + 0.16,
    },
  ];
};

const drawLines = (lines: LineBuilder, total: number) => {
  for (let x = -BOARD[0]; x <= BOARD[0] + 1e-6; x += GRID_STEP) {
    lines.segment([x, 0, -BOARD[1]], [x, 0, BOARD[1]], 0.04);
  }
  for (let z = -BOARD[1]; z <= BOARD[1] + 1e-6; z += GRID_STEP) {
    lines.segment([-BOARD[0], 0, z], [BOARD[0], 0, z], 0.04);
  }
  lines.box(
    [0, PACKAGE_HEIGHT / 2, 0],
    [2 * PACKAGE_HALF, PACKAGE_HEIGHT, 2 * PACKAGE_HALF],
    0.06,
    0.08
  );
  lines.box(
    [0, (PACKAGE_HEIGHT + DIE_TOP) / 2, 0],
    [2 * DIE_HALF, DIE_TOP - PACKAGE_HEIGHT, 2 * DIE_HALF],
    0.08,
    0.14
  );
  const cell = (2 * DIE_HALF) / CORES;
  for (let i = 1; i < CORES; i += 1) {
    const at = -DIE_HALF + i * cell;
    lines.segment([at, DIE_TOP, -DIE_HALF], [at, DIE_TOP, DIE_HALF], 0.16);
    lines.segment([-DIE_HALF, DIE_TOP, at], [DIE_HALF, DIE_TOP, at], 0.16);
  }
  for (const [x, z] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    lines.segment([x * DIE_HALF, DIE_TOP, z * DIE_HALF], [0, HOLO_TOP, 0], 0.28);
  }
  for (let index = 0; index < total; index += 1) {
    const trace = route(index, total);
    const start = 0.38 + (index / total) * 0.22;
    // Packets run outwards: the chip powers every service.
    lines.path(trace.points, start, start + 0.14, true);
    lines.path(route(index, total, SIBLING_GAP).points, start + 0.02, start + 0.16);
    lines.box(
      [trace.pad[0], PAD_HEIGHT / 2, trace.pad[2]],
      [2 * PAD_HALF, PAD_HEIGHT, 2 * PAD_HALF],
      start + 0.14,
      start + 0.18
    );
  }
};

export const sampleAiChip = (count: number, random: Random, params: AiChipParams = {}): Cloud => {
  const total = clampCount(params.pads ?? 9, 1, MAX_PADS);
  const services = Array.from({ length: total }, (_, index) => serviceParts(index, total)).flat();
  const cloud = fillCloud(count, [...boardParts(), ...services], random);
  const lines = createLines();
  drawLines(lines, total);
  return { ...cloud, lines: lines.build() };
};
