import { arcPoints, createLines } from "./lines";
import {
  between,
  fillCloud,
  jitter,
  onBox,
  onCylinder,
  onRing,
  onSphere,
  pickIndex,
  type Cloud,
  type Random,
  type Sampler,
  type Vec3,
} from "./sampling";

/**
 * Automation and integration: six business systems — each a different shape, as CRM, ERP,
 * payments, mail, data and support are different systems — plugged into one integration bus,
 * with every message crossing the bus on a live link and a workflow conveyor carrying jobs
 * underneath. Built systems first, then the bus, then the links and the conveyor. System
 * `i` carries tag `i + 1`, the bus 7.
 */
export const INTEGRATION_BOUNDS: Vec3 = [2.4, 1.5, 1.2];

const HUB: Vec3 = [0, 0.05, 0];
const HUB_RADIUS = 0.42;
const NODE = 0.34;
/** The systems on an ellipse round the bus. */
const NODES: readonly Vec3[] = Array.from({ length: 6 }, (_, index) => {
  const angle = (index / 6) * Math.PI * 2 + Math.PI / 6;
  return [Math.cos(angle) * 1.85, Math.sin(angle) * 0.95 + 0.05, Math.sin(angle * 2) * 0.35];
});

const NODE_SHAPES: readonly ((centre: Vec3) => Sampler)[] = [
  (c) => (r) => onBox(r, c, [NODE, NODE, NODE]),
  (c) => (r) => onSphere(r, NODE * 0.55, c),
  (c) => (r) => onCylinder(r, [c[0], c[1] - NODE / 2, c[2]], NODE * 0.45, NODE),
  (c) => (r) => onBox(r, c, [NODE * 1.2, NODE * 0.75, NODE * 0.25]),
  (c) => (r) => {
    const [x, y, z] = onRing(r, NODE * 0.3, NODE * 0.55);
    return [c[0] + x, c[1] + y + between(r, -0.08, 0.08), c[2] + z];
  },
  (c) => (r) => onBox(r, c, [NODE * 0.8, NODE * 1.1, NODE * 0.8]),
];

const LINKS: Vec3[][] = NODES.map((node) => arcPoints(node, HUB, 0.18, 18));
const CONVEYOR_Y = -1.25;
const CONVEYOR: Vec3[] = [
  [-2.1, CONVEYOR_Y, 0.3],
  [2.1, CONVEYOR_Y, 0.3],
];

const onBus = (random: Random): Vec3 => {
  if (random() < 0.6) {
    return onSphere(random, HUB_RADIUS, HUB);
  }
  const [x, y, z] = onRing(random, HUB_RADIUS * 1.25, HUB_RADIUS * 1.4);
  return [HUB[0] + x, HUB[1] + y * 0.2 + z * 0.15, HUB[2] + z * 0.3];
};

const onConveyor = (random: Random): Vec3 => {
  if (random() < 0.55) {
    return [between(random, -2.1, 2.1), CONVEYOR_Y + between(random, -0.03, 0.03), 0.3];
  }
  // Jobs riding the conveyor: small packets at even steps.
  const step = pickIndex(random, 9);
  return jitter(random, [-1.8 + step * 0.45, CONVEYOR_Y + 0.1, 0.3], 0.04);
};

export const sampleIntegration = (count: number, random: Random): Cloud => {
  const systems = NODES.map((centre, index) => ({
    weight: 1,
    tag: index + 1,
    sample: NODE_SHAPES[index](centre),
    order: () => 0.03 + index * 0.05 + 0.08 * random(),
  }));
  const cloud = fillCloud(
    count,
    [
      ...systems,
      { weight: 1.6, tag: 7, sample: onBus, order: () => 0.42 + 0.12 * random() },
      {
        weight: 0.9,
        sample: (r) => {
          const link = LINKS[pickIndex(r, LINKS.length)];
          return jitter(r, link[pickIndex(r, link.length)], 0.008);
        },
        order: () => 0.6 + 0.25 * random(),
      },
      { weight: 0.6, sample: onConveyor, order: (p) => 0.82 + 0.16 * ((p[0] + 2.1) / 4.2) },
    ],
    random
  );

  const lines = createLines();
  NODES.forEach((centre, index) => {
    const from = 0.03 + index * 0.05;
    lines.box(centre, [NODE, NODE, NODE], from, from + 0.1);
  });
  LINKS.forEach((link, index) => {
    lines.path(link, 0.6 + index * 0.03, 0.8, true);
    lines.path([...link].reverse(), 0.62 + index * 0.03, 0.82, true);
  });
  lines.path(CONVEYOR, 0.82, 0.98, true);
  lines.segment([-2.1, CONVEYOR_Y - 0.12, 0.3], [2.1, CONVEYOR_Y - 0.12, 0.3], 0.82);
  [-1.6, 0, 1.6].forEach((x) =>
    lines.path(
      arcPoints([x, CONVEYOR_Y, 0.3], [x * 0.4, HUB[1] - HUB_RADIUS, 0], 0.05, 10),
      0.85,
      0.95,
      true
    )
  );
  return { ...cloud, lines: lines.build() };
};
