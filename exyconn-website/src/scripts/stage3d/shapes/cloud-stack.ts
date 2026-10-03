import { arcPoints, createLines } from "./lines";
import {
  between,
  fillCloud,
  jitter,
  onSphere,
  pickIndex,
  type Cloud,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Software as a service: one cloud platform serving many tenants. A cloud of overlapping
 * domes holds a stack of servers; below, a laptop, a monitor, a tablet and phones — each
 * tenant — connect up into it over live links. Built tenants first, then the links rising,
 * then the cloud bottom to top. Tenant `i` carries tag `i + 1`, the cloud 6.
 */
export const CLOUD_STACK_BOUNDS: Vec3 = [2.3, 1.6, 1.2];

const CLOUD_Y = 0.75;
const PUFFS: readonly (readonly [number, number, number, number])[] = [
  [0, CLOUD_Y + 0.25, 0, 0.55],
  [-0.65, CLOUD_Y, 0.05, 0.45],
  [0.65, CLOUD_Y, -0.05, 0.48],
  [-1.15, CLOUD_Y - 0.15, 0, 0.3],
  [1.2, CLOUD_Y - 0.12, 0, 0.32],
];
const DEVICE_Y = -1.05;
/** [x, z, width, height, depth] of each tenant's screen. */
const TENANTS: readonly (readonly [number, number, number, number, number])[] = [
  [-1.75, 0.2, 0.7, 0.45, 0.04],
  [-0.85, 0.55, 0.9, 0.6, 0.05],
  [0.1, 0.65, 0.32, 0.55, 0.03],
  [0.85, 0.5, 0.55, 0.42, 0.03],
  [1.75, 0.15, 0.7, 0.45, 0.04],
];

const onCloud = (random: Random): Vec3 => {
  const [x, y, z, radius] = PUFFS[pickIndex(random, PUFFS.length)];
  const point = onSphere(random, radius, [x, y, z]);
  // Flatten the underside so the domes sit on one base.
  return [point[0], Math.max(point[1], CLOUD_Y - 0.28), point[2] * 0.7];
};

const SERVERS = [-0.24, -0.08, 0.08];
const onServer = (random: Random): Vec3 => [
  between(random, -0.35, 0.35),
  CLOUD_Y + SERVERS[pickIndex(random, SERVERS.length)] + between(random, -0.02, 0.02),
  between(random, -0.15, 0.15),
];

const screenOf = (index: number): Vec3 => {
  const [x, z, , h] = TENANTS[index];
  return [x, DEVICE_Y + h / 2 + 0.06, z];
};

const onTenant =
  (index: number) =>
  (random: Random): Vec3 => {
    const [x, z, w, h] = TENANTS[index];
    const top = DEVICE_Y + 0.06;
    if (random() < 0.25) {
      // The keyboard deck or stand under the screen.
      return [x + between(random, -w / 2, w / 2), DEVICE_Y, z + between(random, 0, 0.25)];
    }
    const u = between(random, -w / 2, w / 2);
    const v = between(random, 0, h);
    if (random() >= 0.45) {
      return jitter(random, [x + u * 0.85, top + v, z], 0.005);
    }
    // The screen's bezel: its top or bottom edge, or one of its sides.
    const far = random() < 0.5;
    if (random() < 0.5) {
      return [x + u, top + (far ? h : 0), z];
    }
    return [x + (far ? w / 2 : -w / 2), top + v, z];
  };

const LINKS: Vec3[][] = TENANTS.map((_, index) => {
  const [x, y, z] = screenOf(index);
  return arcPoints([x, y + 0.3, z], [x * 0.35, CLOUD_Y - 0.28, 0], 0.1, 14);
});

export const sampleCloudStack = (count: number, random: Random): Cloud => {
  const tenants = TENANTS.map((_, index) => ({
    weight: 0.7,
    tag: index + 1,
    sample: onTenant(index),
    order: () => 0.02 + index * 0.05 + 0.1 * random(),
  }));
  const cloud = fillCloud(
    count,
    [
      ...tenants,
      {
        weight: 0.6,
        sample: (r: Random) => {
          const link = LINKS[pickIndex(r, LINKS.length)];
          return jitter(r, link[pickIndex(r, link.length)], 0.008);
        },
        order: (p: Vec3) => 0.38 + 0.2 * ((p[1] - DEVICE_Y) / 1.6),
      },
      {
        weight: 2.2,
        tag: 6,
        sample: onCloud,
        order: (p: Vec3) => 0.6 + 0.35 * ((p[1] - CLOUD_Y + 0.3) / 1.2),
      },
      { weight: 0.5, tag: 6, sample: onServer, order: () => 0.62 + 0.1 * random() },
    ],
    random
  );

  const lines = createLines();
  TENANTS.forEach(([x, z, w, h], index) => {
    const from = 0.02 + index * 0.05;
    lines.box([x, DEVICE_Y + 0.06 + h / 2, z], [w, h, 0.02], from, from + 0.12);
    lines.segment([x - w / 2, DEVICE_Y, z + 0.25], [x + w / 2, DEVICE_Y, z + 0.25], from);
  });
  LINKS.forEach((link, index) => lines.path(link, 0.38 + index * 0.02, 0.58, true));
  SERVERS.forEach((y) => lines.box([0, CLOUD_Y + y, 0], [0.7, 0.1, 0.3], 0.62, 0.7));
  return { ...cloud, lines: lines.build() };
};
