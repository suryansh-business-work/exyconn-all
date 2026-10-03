import { arcPoints, createLines } from "./lines";
import {
  between,
  fillCloud,
  jitter,
  pickIndex,
  type Cloud,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Maintenance and support: a running system kept healthy. A large gear with a smaller one
 * meshed beside it turns the work; a monitoring screen shows the uptime heartbeat, response
 * bars and status lights, wired to the gears. Built gears first (round their rims), then the
 * screen from left to right. The large gear is tag 1, the small 2, the screen 3.
 */
export const OPS_BOUNDS: Vec3 = [2.45, 1.45, 0.6];

const TAU = Math.PI * 2;
const BIG: Vec3 = [-1.2, 0.1, 0];
const SMALL: Vec3 = [-0.2, -0.75, 0.1];
const SCREEN = { x0: 0.25, x1: 2.35, y0: -0.6, y1: 1.15, z: -0.05 } as const;

/** A point on a gear in the XY plane: rim with teeth, inner hub and spokes. */
const gearPoint =
  (centre: Vec3, radius: number, teeth: number) =>
  (random: Random): Vec3 => {
    const angle = random() * TAU;
    const roll = random();
    let r: number;
    if (roll < 0.55) {
      const toothPhase = (angle * teeth) / TAU;
      const tooth = toothPhase - Math.floor(toothPhase) < 0.5 ? 0.16 : 0;
      r = radius * (1 + tooth * random()) - between(random, 0, radius * 0.1);
    } else if (roll < 0.8) {
      r = radius * between(random, 0.22, 0.32);
    } else {
      const spoke = (Math.floor((angle / TAU) * 5) + 0.5) * (TAU / 5);
      const along = between(random, 0.3, 0.9) * radius;
      return jitter(
        random,
        [centre[0] + Math.cos(spoke) * along, centre[1] + Math.sin(spoke) * along, centre[2]],
        0.02
      );
    }
    return [
      centre[0] + Math.cos(angle) * r,
      centre[1] + Math.sin(angle) * r,
      centre[2] + between(random, -0.06, 0.06),
    ];
  };

/** The heartbeat: flat, a spike, flat — across the top of the screen. */
const HEARTBEAT: Vec3[] = (() => {
  const base = 0.75;
  const xs = [0.4, 0.8, 0.95, 1.05, 1.15, 1.3, 1.6, 1.75, 1.85, 1.95, 2.1, 2.25];
  const ys = [0, 0, 0.25, -0.2, 0.32, 0, 0, 0.2, -0.15, 0.28, 0, 0];
  return xs.map((x, i) => [x, base + ys[i], SCREEN.z] as Vec3);
})();

const BARS = [0.3, 0.45, 0.25, 0.5, 0.35, 0.55, 0.4];
const barX = (i: number) => 0.5 + i * 0.26;

const screenPoint = (random: Random): Vec3 => {
  const roll = random();
  if (roll < 0.35) {
    const i = pickIndex(random, HEARTBEAT.length - 1);
    const t = random();
    const [a, b] = [HEARTBEAT[i], HEARTBEAT[i + 1]];
    return jitter(random, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, SCREEN.z], 0.008);
  }
  if (roll < 0.75) {
    const i = pickIndex(random, BARS.length);
    return [barX(i) + between(random, -0.08, 0.08), SCREEN.y0 + 0.1 + random() * BARS[i], SCREEN.z];
  }
  if (roll < 0.85) {
    const light = pickIndex(random, 4);
    return jitter(random, [2.2, 0.35 - light * 0.2, SCREEN.z], 0.025);
  }
  return [between(random, SCREEN.x0, SCREEN.x1), random() < 0.5 ? SCREEN.y0 : SCREEN.y1, SCREEN.z];
};

const WIRE = arcPoints([BIG[0] + 0.6, BIG[1] + 0.5, 0], [SCREEN.x0, 0.6, SCREEN.z], 0.25, 16);

export const sampleOps = (count: number, random: Random): Cloud => {
  const sweep = (centre: Vec3, from: number) => (p: Vec3) =>
    from + 0.2 * ((Math.atan2(p[1] - centre[1], p[0] - centre[0]) + Math.PI) / TAU);
  const cloud = fillCloud(
    count,
    [
      { weight: 2, tag: 1, sample: gearPoint(BIG, 0.85, 12), order: sweep(BIG, 0.02) },
      { weight: 0.9, tag: 2, sample: gearPoint(SMALL, 0.42, 8), order: sweep(SMALL, 0.2) },
      {
        weight: 2,
        tag: 3,
        sample: screenPoint,
        order: (p) => 0.45 + 0.5 * ((p[0] - SCREEN.x0) / (SCREEN.x1 - SCREEN.x0)),
      },
      {
        weight: 0.3,
        sample: (r) => jitter(r, WIRE[pickIndex(r, WIRE.length)], 0.008),
        order: () => 0.42,
      },
    ],
    random
  );

  const lines = createLines();
  const circle = (centre: Vec3, radius: number, from: number) =>
    lines.path(
      Array.from(
        { length: 41 },
        (_, i) =>
          [
            centre[0] + Math.cos((i / 40) * TAU) * radius,
            centre[1] + Math.sin((i / 40) * TAU) * radius,
            centre[2],
          ] as Vec3
      ),
      from,
      from + 0.2
    );
  circle(BIG, 0.85, 0.02);
  circle(BIG, 0.25, 0.1);
  circle(SMALL, 0.42, 0.2);
  lines.path(
    [
      [SCREEN.x0, SCREEN.y0, SCREEN.z],
      [SCREEN.x1, SCREEN.y0, SCREEN.z],
      [SCREEN.x1, SCREEN.y1, SCREEN.z],
      [SCREEN.x0, SCREEN.y1, SCREEN.z],
      [SCREEN.x0, SCREEN.y0, SCREEN.z],
    ],
    0.42,
    0.5
  );
  lines.path(HEARTBEAT, 0.5, 0.95, true);
  lines.path(WIRE, 0.38, 0.45, true);
  return { ...cloud, lines: lines.build() };
};
