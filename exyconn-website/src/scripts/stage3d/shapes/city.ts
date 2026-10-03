import { arcPoints, createLines } from "./lines";
import {
  between,
  fillCloud,
  jitter,
  pickIndex,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Enterprise: a business district. Eight towers of different heights stand on a gridded
 * plaza, each facade a grid of lit windows; the tallest is headquarters, with an antenna.
 * The plaza is laid first, then every tower rises floor by floor, and last the rooftop data
 * links light up between the towers and headquarters. Tower `i` carries tag `i + 1`.
 */
export const CITY_BOUNDS: Vec3 = [2.45, 1.7, 1.45];

const GROUND = -1.45;
const FLOOR = 0.13;
const COLUMN = 0.11;
/** [x, z, width, depth, height] — headquarters is index 2. */
const TOWERS: readonly (readonly [number, number, number, number, number])[] = [
  [-1.75, -0.35, 0.5, 0.5, 1.6],
  [-1.05, 0.55, 0.46, 0.46, 2.15],
  [-0.2, -0.45, 0.62, 0.62, 2.95],
  [0.6, 0.45, 0.5, 0.5, 2.4],
  [1.35, -0.5, 0.46, 0.46, 1.85],
  [1.95, 0.6, 0.4, 0.4, 1.25],
  [-0.75, -1.1, 0.4, 0.4, 1.05],
  [0.9, -1.1, 0.42, 0.42, 1.4],
];
const HQ = 2;
const TALLEST = Math.max(...TOWERS.map((tower) => tower[4]));
const ANTENNA = 0.18;

/** When a height on a tower is built: the plaza first, then floors bottom to top. */
const rise = (index: number) => (point: Vec3) =>
  0.14 + index * 0.012 + 0.62 * ((point[1] - GROUND) / TALLEST);

/** A lit window on one of the tower's four facades, facades weighted by width. */
const windowOn =
  (index: number) =>
  (random: Random): Vec3 => {
    const [x, z, w, d, h] = TOWERS[index];
    const facade = pickIndex(random, 4);
    const across = facade % 2 === 0 ? w : d;
    const columns = Math.max(2, Math.floor(across / COLUMN));
    const floors = Math.max(2, Math.floor(h / FLOOR));
    const u = ((pickIndex(random, columns) + 0.5) / columns - 0.5) * across;
    const y = GROUND + (pickIndex(random, floors) + 0.5) * (h / floors);
    const facePoints: Vec3[] = [
      [x + u, y, z + d / 2],
      [x + w / 2, y, z + u],
      [x - u, y, z - d / 2],
      [x - w / 2, y, z - u],
    ];
    return jitter(random, facePoints[facade], 0.012);
  };

const plaza = (random: Random): Vec3 => {
  const onLine = random() < 0.55;
  const x = between(random, -2.35, 2.35);
  const z = between(random, -1.38, 1.38);
  if (!onLine) {
    return [x, GROUND, z];
  }
  return random() < 0.5
    ? [Math.round(x / 0.4) * 0.4, GROUND, z]
    : [x, GROUND, Math.round(z / 0.4) * 0.4];
};

const roofOf = (index: number): Vec3 => {
  const [x, z, , , h] = TOWERS[index];
  return [x, GROUND + h, z];
};

/** Rooftop links: every tower to headquarters, and a ring between neighbours. */
const LINKS: readonly (readonly [number, number])[] = [
  ...TOWERS.map((_, index) => [index, HQ] as const).filter(([index]) => index !== HQ),
  [0, 1],
  [3, 4],
  [4, 5],
  [6, 7],
];

const linkPoint = (random: Random): Vec3 => {
  const [from, to] = LINKS[pickIndex(random, LINKS.length)];
  const arc = arcPoints(roofOf(from), roofOf(to), 0.35, 24);
  return jitter(random, arc[pickIndex(random, arc.length)], 0.01);
};

export const sampleCity = (count: number, random: Random): Cloud => {
  const towers: Part[] = TOWERS.map((tower, index) => ({
    weight: tower[4] * (tower[2] + tower[3]),
    tag: index + 1,
    sample: windowOn(index),
    order: rise(index),
  }));
  const antenna: Part = {
    weight: 0.08,
    tag: HQ + 1,
    sample: (r) => {
      const [x, y, z] = roofOf(HQ);
      return [x, y + r() * ANTENNA, z];
    },
    order: () => 0.8,
  };
  const cloud = fillCloud(
    count,
    [
      { weight: 1.2, sample: plaza, order: (p) => 0.12 * ((p[0] + 2.4) / 4.8) },
      ...towers,
      antenna,
      { weight: 0.5, sample: linkPoint, order: () => 0.86 + 0.1 * random() },
    ],
    random
  );

  const lines = createLines();
  for (let i = -5; i <= 5; i += 1) {
    lines.segment([i * 0.45, GROUND, -1.4], [i * 0.45, GROUND, 1.4], 0.04);
  }
  for (let i = -3; i <= 3; i += 1) {
    lines.segment([-2.4, GROUND, i * 0.45], [2.4, GROUND, i * 0.45], 0.06);
  }
  TOWERS.forEach(([x, z, w, d, h], index) => {
    lines.box(
      [x, GROUND + h / 2, z],
      [w, h, d],
      0.14 + index * 0.012,
      rise(index)([x, GROUND + h, z])
    );
  });
  const hqRoof = roofOf(HQ);
  lines.segment(hqRoof, [hqRoof[0], hqRoof[1] + ANTENNA, hqRoof[2]], 0.8);
  LINKS.forEach(([from, to], index) => {
    lines.path(arcPoints(roofOf(from), roofOf(to), 0.35), 0.86 + index * 0.01, 0.96, true);
  });
  return { ...cloud, lines: lines.build() };
};
