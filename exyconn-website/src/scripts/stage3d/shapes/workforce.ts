import { createLines, type LineBuilder } from "./lines";
import {
  between,
  clampCount,
  fillCloud,
  jitter,
  offset,
  onArc,
  onSphere,
  pickIndex,
  tiltX,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Hiring: a corporate headquarters with an organisation that is growing. A glass tower and two
 * wings rise floor by floor; in front of them an org chart builds from the top down — a lead,
 * four heads, eight managers and sixteen team members — with a team standing on the plaza
 * below. The chart's `openings` seats are left empty, drawn as a ring with a plus, and their
 * links carry moving packets: the roles still to fill. Opening `i` carries tag `i + 1`.
 */
export interface WorkforceParams {
  openings?: number;
}

export const WORKFORCE_BOUNDS: Vec3 = [2.4, 1.7, 1.25];
export const MAX_OPENINGS = 8;

const GROUND = -1.5;
const CHART_Z = 0.25;
const LEVEL_Y = [1.05, 0.4, -0.25, -0.9] as const;
const LEVEL_SIZE = [1, 4, 8, 16] as const;
const CHART_WIDTH = 4.05;
/** [x, z, width, depth, height] — the tower first, then its wings. */
const BLOCKS: readonly (readonly [number, number, number, number, number])[] = [
  [0, -0.85, 1.3, 0.5, 2.9],
  [-1.4, -0.85, 0.85, 0.45, 1.55],
  [1.4, -0.85, 0.85, 0.45, 1.55],
];
const FLOOR = 0.13;
const COLUMN = 0.12;
const TALLEST = 2.9;
const CROWD_ROWS = [
  { z: 0.75, count: 13 },
  { z: 1.1, count: 14 },
] as const;

interface Seat {
  at: Vec3;
  parent: number | null;
  level: number;
}

/** Every seat of the chart, top down; each seat reports to one in the level above. */
const chartSeats = (): Seat[] => {
  const seats: Seat[] = [];
  let parentStart = 0;
  LEVEL_SIZE.forEach((size, level) => {
    const start = seats.length;
    for (let i = 0; i < size; i += 1) {
      const x = ((i + 0.5) / size - 0.5) * CHART_WIDTH * Math.min(1, 0.45 + level * 0.2);
      const parent =
        level === 0 ? null : parentStart + Math.floor((i * LEVEL_SIZE[level - 1]) / size);
      seats.push({ at: [x, LEVEL_Y[level], CHART_Z], parent, level });
    }
    parentStart = start;
  });
  return seats;
};

/** Which bottom-row seats are open: spread evenly along the row. */
const openSeats = (seats: readonly Seat[], openings: number): number[] => {
  const row = seats.map((seat, index) => ({ seat, index })).filter(({ seat }) => seat.level === 3);
  return Array.from(
    { length: openings },
    (_, k) => row[Math.floor(((k + 0.5) / openings) * row.length)].index
  );
};

/** Head and shoulders facing the viewer, `scale` times the chart size. */
const person = (random: Random, at: Vec3, scale: number): Vec3 => {
  if (random() < 0.4) {
    return onSphere(random, 0.045 * scale, offset(at, [0, 0.075 * scale, 0]));
  }
  const [x, y, z] = tiltX(onArc(random, 0.085 * scale, 0, Math.PI), -Math.PI / 2);
  return offset([x, y - 0.035 * scale, z * 0.4], at);
};

/** An empty seat: a ring with a plus in it. */
const vacancy = (random: Random, at: Vec3): Vec3 => {
  if (random() < 0.7) {
    const angle = random() * Math.PI * 2;
    return offset([0.09 * Math.cos(angle), 0.09 * Math.sin(angle), 0], at);
  }
  const t = between(random, -0.045, 0.045);
  return offset(random() < 0.5 ? [t, 0, 0] : [0, t, 0], at);
};

/** A lit window on a block's front or side facade. */
const windowOn =
  (block: number) =>
  (random: Random): Vec3 => {
    const [x, z, w, d, h] = BLOCKS[block];
    const front = random() < 0.75;
    const across = front ? w : d;
    const columns = Math.max(2, Math.floor(across / COLUMN));
    const floors = Math.max(2, Math.floor(h / FLOOR));
    const u = ((pickIndex(random, columns) + 0.5) / columns - 0.5) * across;
    const y = GROUND + (pickIndex(random, floors) + 0.5) * (h / floors);
    const sideX = x + (u > 0 ? w / 2 : -w / 2);
    return jitter(random, front ? [x + u, y, z + d / 2] : [sideX, y, z + u], 0.01);
  };

const rise = (point: Vec3) => 0.3 * ((point[1] - GROUND) / TALLEST);
const chartOrder = (level: number) => 0.34 + level * 0.1;

/** The tower's frame and the chart's reporting lines, built in the same order as the points. */
function drawLines(lines: LineBuilder, seats: readonly Seat[], open: ReadonlySet<number>): void {
  BLOCKS.forEach(([x, z, w, d, h]) => {
    lines.box([x, GROUND + h / 2, z], [w, h, d], 0, 0.3 * (h / TALLEST));
  });
  seats.forEach((seat, index) => {
    if (seat.parent === null) return;
    const from = seats[seat.parent].at;
    const midY = (from[1] + seat.at[1]) / 2;
    const at = chartOrder(seat.level) - 0.05;
    lines.path(
      [
        [from[0], from[1] - 0.14, CHART_Z],
        [from[0], midY, CHART_Z],
        [seat.at[0], midY, CHART_Z],
        [seat.at[0], seat.at[1] + 0.16, CHART_Z],
      ],
      at,
      at + 0.06,
      open.has(index)
    );
  });
}

export const sampleWorkforce = (
  count: number,
  random: Random,
  params: WorkforceParams = {}
): Cloud => {
  const openings = clampCount(params.openings ?? 3, 1, MAX_OPENINGS);
  const seats = chartSeats();
  const open = openSeats(seats, openings);
  const openSet = new Set(open);
  const buildings: Part[] = BLOCKS.map((_, block) => ({
    weight: block === 0 ? 3.2 : 1.2,
    sample: windowOn(block),
    order: rise,
  }));
  const people: Part[] = seats
    .filter((_, index) => !openSet.has(index))
    .map((seat) => ({
      weight: 0.55,
      sample: (r) => person(r, seat.at, 1),
      order: () => chartOrder(seat.level),
    }));
  const vacancies: Part[] = open.map((index, k) => ({
    weight: 0.6,
    tag: k + 1,
    sample: (r) => vacancy(r, seats[index].at),
    order: () => 0.9,
  }));
  const crowd: Part[] = CROWD_ROWS.flatMap(({ z, count: size }) =>
    Array.from({ length: size }, (_, i) => {
      const at: Vec3 = [((i + 0.5) / size - 0.5) * 3.9, GROUND + 0.12, z];
      return {
        weight: 0.6,
        sample: (r: Random) => person(r, at, 1.3),
        order: () => 0.76 + i * 0.004,
      };
    })
  );
  const cloud = fillCloud(count, [...buildings, ...people, ...crowd, ...vacancies], random);
  const lines = createLines();
  drawLines(lines, seats, openSet);
  return { ...cloud, lines: lines.build() };
};
