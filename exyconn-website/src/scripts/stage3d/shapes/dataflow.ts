import { arcPoints, createLines } from "./lines";
import {
  between,
  fillCloud,
  jitter,
  onSphere,
  pickIndex,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Data analytics: data from many servers becomes a chart. Four server racks (unit slots,
 * status lights) stream along links into a processing core, which feeds a chart panel: bars
 * grow up from the axis and a trend line draws across their tops. Built in that order —
 * racks, the streams, the core, the axes, the bars, the line. Rack `i` is tag `i + 1`, the
 * core 5, the chart 6.
 */
export const DATAFLOW_BOUNDS: Vec3 = [2.55, 1.15, 0.95];

const RACK_SIZE: Vec3 = [0.4, 1.9, 0.38];
const RACKS: readonly Vec3[] = [
  [-2.1, 0, -0.45],
  [-2.1, 0, 0.45],
  [-1.5, 0, -0.45],
  [-1.5, 0, 0.45],
];
const SLOTS = 9;
const CORE: Vec3 = [-0.35, 0.05, 0];
const CORE_RADIUS = 0.36;
const AXIS_X = 0.55;
const AXIS_Y = -0.95;
const CHART_RIGHT = 2.45;
const BARS = [0.55, 0.85, 0.7, 1.15, 1.4, 1.8];
const BAR_WIDTH = 0.2;
const BAR_DEPTH = 0.14;

const barX = (index: number) =>
  AXIS_X + 0.3 + (index * (CHART_RIGHT - AXIS_X - 0.5)) / (BARS.length - 1);
const LINE: Vec3[] = BARS.map((height, index) => [barX(index), AXIS_Y + height + 0.12, 0]);

/** A point on a rack's front face, crowded onto its unit slots and status lights. */
const rackPoint =
  (index: number) =>
  (random: Random): Vec3 => {
    const [cx, , cz] = RACKS[index];
    const [w, h, d] = RACK_SIZE;
    const slot = pickIndex(random, SLOTS);
    const y = -h / 2 + (slot + 0.5) * (h / SLOTS);
    const front = cz + d / 2;
    if (random() < 0.18) {
      return jitter(random, [cx + w * 0.36, y, front], 0.01);
    }
    if (random() < 0.3) {
      const side = random() < 0.5 ? -1 : 1;
      return [
        cx + (side * w) / 2,
        between(random, -h / 2, h / 2),
        cz + between(random, -d / 2, d / 2),
      ];
    }
    return [cx + between(random, -w * 0.42, w * 0.25), y + between(random, -0.035, 0.035), front];
  };

const rackFront = (index: number, height: number): Vec3 => {
  const [cx, , cz] = RACKS[index];
  return [cx + RACK_SIZE[0] / 2, height, cz];
};

const STREAMS: Vec3[][] = RACKS.flatMap((_, index) =>
  [-0.5, 0.35].map((height) => arcPoints(rackFront(index, height), CORE, 0.25, 20))
);
const OUTPUT: Vec3[] = arcPoints([CORE[0] + CORE_RADIUS, CORE[1], 0], [AXIS_X, 0.4, 0], 0.2, 16);

const onStream = (random: Random): Vec3 => {
  const stream = STREAMS[pickIndex(random, STREAMS.length)];
  return jitter(random, stream[pickIndex(random, stream.length)], 0.008);
};

/** A point inside one bar, built from the axis upwards. */
const barPoint = (random: Random): Vec3 => {
  const index = pickIndex(random, BARS.length);
  const height = BARS[index];
  const x = barX(index) + between(random, -BAR_WIDTH / 2, BAR_WIDTH / 2);
  const y = AXIS_Y + random() * height;
  if (random() < 0.5) {
    // The bar's front and back faces, so it reads as a solid block.
    return [x, y, random() < 0.5 ? -BAR_DEPTH / 2 : BAR_DEPTH / 2];
  }
  return [x, y, between(random, -BAR_DEPTH / 2, BAR_DEPTH / 2)];
};

const linePoint = (random: Random): Vec3 => {
  const segment = pickIndex(random, LINE.length - 1);
  const t = random();
  const [a, b] = [LINE[segment], LINE[segment + 1]];
  return jitter(random, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0], 0.01);
};

export const sampleDataflow = (count: number, random: Random): Cloud => {
  const racks: Part[] = RACKS.map((_, index) => ({
    weight: 1,
    tag: index + 1,
    sample: rackPoint(index),
    order: (p: Vec3) => 0.02 + index * 0.03 + 0.18 * ((p[1] + 1) / 2),
  }));
  const chartBottom = (p: Vec3) => (p[1] - AXIS_Y) / Math.max(...BARS);
  const cloud = fillCloud(
    count,
    [
      ...racks,
      { weight: 0.8, sample: onStream, order: (p) => 0.3 + 0.18 * ((p[0] + 2) / 1.7) },
      {
        weight: 0.7,
        tag: 5,
        sample: (r) =>
          r() < 0.75 ? onSphere(r, CORE_RADIUS, CORE) : onSphere(r, CORE_RADIUS * 0.45, CORE),
        order: () => 0.45 + 0.08 * random(),
      },
      {
        weight: 0.25,
        sample: (r) => jitter(r, OUTPUT[pickIndex(r, OUTPUT.length)], 0.008),
        order: () => 0.55,
      },
      { weight: 1.6, tag: 6, sample: barPoint, order: (p) => 0.6 + 0.28 * chartBottom(p) },
      { weight: 0.5, tag: 6, sample: linePoint, order: (p) => 0.88 + 0.11 * ((p[0] - AXIS_X) / 2) },
    ],
    random
  );

  const lines = createLines();
  RACKS.forEach((centre, index) => {
    const from = 0.02 + index * 0.03;
    lines.box(centre, RACK_SIZE, from, from + 0.18);
    for (let slot = 1; slot < SLOTS; slot += 1) {
      const y = -RACK_SIZE[1] / 2 + (slot * RACK_SIZE[1]) / SLOTS;
      const front = centre[2] + RACK_SIZE[2] / 2;
      lines.segment(
        [centre[0] - 0.2, y, front],
        [centre[0] + 0.2, y, front],
        from + 0.18 * (slot / SLOTS)
      );
    }
  });
  STREAMS.forEach((stream, index) => lines.path(stream, 0.3 + index * 0.01, 0.46, true));
  lines.path(OUTPUT, 0.52, 0.58, true);
  lines.path(
    [
      [AXIS_X, AXIS_Y + 2.05, 0],
      [AXIS_X, AXIS_Y, 0],
      [CHART_RIGHT, AXIS_Y, 0],
    ],
    0.56,
    0.6
  );
  [0.5, 1, 1.5].forEach((step) =>
    lines.segment([AXIS_X, AXIS_Y + step, 0], [CHART_RIGHT, AXIS_Y + step, 0], 0.6)
  );
  BARS.forEach((height, index) =>
    lines.box(
      [barX(index), AXIS_Y + height / 2, 0],
      [BAR_WIDTH, height, BAR_DEPTH],
      0.6,
      0.6 + 0.28 * (height / Math.max(...BARS))
    )
  );
  lines.path(LINE, 0.88, 0.99, true);
  return { ...cloud, lines: lines.build() };
};
