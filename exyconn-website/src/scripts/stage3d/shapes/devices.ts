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
 * Mobile apps: three phones fanned out, each screen a working app — status bar, header,
 * content cards and a bottom navigation — with app icons floating between them and sync
 * links passing data from phone to phone. Each phone is built outline first, then its screen
 * top to bottom. Phone `i` carries tag `i + 1`.
 */
export const DEVICES_BOUNDS: Vec3 = [2.2, 1.6, 0.9];

const W = 0.95;
const H = 1.9;
const RADIUS = 0.12;
/** [x, y, z, turn about Y] */
const PHONES: readonly (readonly [number, number, number, number])[] = [
  [0, 0, 0.3, 0],
  [-1.32, -0.1, -0.2, 0.45],
  [1.32, -0.1, -0.2, -0.45],
];

/** A phone's local (x, y) on its screen plane, placed in the scene. */
const place = (index: number, x: number, y: number): Vec3 => {
  const [px, py, pz, turn] = PHONES[index];
  return [px + x * Math.cos(turn), py + y, pz - x * Math.sin(turn)];
};

/** The rounded outline of a phone, as local (x, y) points. */
const OUTLINE: [number, number][] = (() => {
  const corners: [number, number, number][] = [
    [W / 2 - RADIUS, H / 2 - RADIUS, 0],
    [-W / 2 + RADIUS, H / 2 - RADIUS, Math.PI / 2],
    [-W / 2 + RADIUS, -H / 2 + RADIUS, Math.PI],
    [W / 2 - RADIUS, -H / 2 + RADIUS, (Math.PI * 3) / 2],
  ];
  const points: [number, number][] = corners.flatMap(([cx, cy, start]) =>
    Array.from({ length: 6 }, (_, i) => {
      const angle = start + (i / 5) * (Math.PI / 2);
      return [cx + RADIUS * Math.cos(angle), cy + RADIUS * Math.sin(angle)] as [number, number];
    })
  );
  return [...points, points[0]];
})();

/** Screen blocks as [x0, y0, x1, y1] in local units: header, cards, bottom navigation. */
const BLOCKS: readonly (readonly [number, number, number, number])[] = [
  [-0.38, 0.62, 0.38, 0.78],
  [-0.38, 0.22, 0.38, 0.52],
  [-0.38, -0.12, 0.05, 0.14],
  [0.12, -0.12, 0.38, 0.14],
  [-0.38, -0.55, 0.38, -0.2],
  [-0.38, -0.82, 0.38, -0.68],
];

/** When a point at local height `y` on phone `index` is built: screens fill top down. */
const screenOrder = (index: number, y: number) => 0.3 + index * 0.04 + 0.45 * ((H / 2 - y) / H);

const phonePoint =
  (index: number) =>
  (random: Random): Vec3 => {
    const roll = random();
    if (roll < 0.35) {
      const [x, y] = OUTLINE[pickIndex(random, OUTLINE.length)];
      return jitter(random, place(index, x, y), 0.01);
    }
    if (roll < 0.4) {
      return place(index, between(random, -0.1, 0.1), H / 2 - 0.06);
    }
    const [x0, y0, x1, y1] = BLOCKS[pickIndex(random, BLOCKS.length)];
    return place(index, between(random, x0, x1), between(random, y0, y1));
  };

/** Floating app icons: small squares between the phones. */
const ICONS: readonly Vec3[] = [
  [-0.75, 1.25, 0],
  [-0.25, 1.4, 0.1],
  [0.3, 1.32, 0.05],
  [0.8, 1.2, -0.05],
];

const iconPoint = (random: Random): Vec3 => {
  const [x, y, z] = ICONS[pickIndex(random, ICONS.length)];
  return [x + between(random, -0.08, 0.08), y + between(random, -0.08, 0.08), z];
};

const SYNC: Vec3[][] = [
  arcPoints(place(1, W / 2, 0.4), place(0, -W / 2, 0.4), 0.3),
  arcPoints(place(0, W / 2, 0.4), place(2, -W / 2, 0.4), 0.3),
  arcPoints(place(2, -W / 2, -0.4), place(1, W / 2, -0.4), -0.25),
];

export const sampleDevices = (count: number, random: Random): Cloud => {
  const phones: Part[] = PHONES.map((_, index) => ({
    weight: index === 0 ? 1.4 : 1,
    tag: index + 1,
    sample: phonePoint(index),
    order: (p: Vec3) => screenOrder(index, p[1] - PHONES[index][1]),
  }));
  const cloud = fillCloud(
    count,
    [
      ...phones,
      { weight: 0.3, sample: iconPoint, order: (p) => 0.78 + 0.08 * ((p[0] + 1) / 2) },
      {
        weight: 0.3,
        sample: (r) => {
          const arc = SYNC[pickIndex(r, SYNC.length)];
          return jitter(r, arc[pickIndex(r, arc.length)], 0.008);
        },
        order: () => 0.88 + 0.1 * random(),
      },
    ],
    random
  );

  const lines = createLines();
  PHONES.forEach((_, index) => {
    const from = 0.02 + index * 0.06;
    lines.path(
      OUTLINE.map(([x, y]) => place(index, x, y)),
      from,
      from + 0.25
    );
    BLOCKS.forEach(([x0, y0, x1, y1]) => {
      const at = screenOrder(index, y1);
      lines.path(
        [
          place(index, x0, y0),
          place(index, x1, y0),
          place(index, x1, y1),
          place(index, x0, y1),
          place(index, x0, y0),
        ],
        at,
        at + 0.05
      );
    });
  });
  ICONS.forEach(([x, y, z]) => lines.box([x, y, z], [0.16, 0.16, 0.02], 0.8, 0.84));
  SYNC.forEach((arc, index) => lines.path(arc, 0.88 + index * 0.02, 0.97, true));
  return { ...cloud, lines: lines.build() };
};
