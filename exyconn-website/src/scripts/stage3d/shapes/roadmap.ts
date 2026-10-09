import { arcPoints, createLines } from "./lines";
import {
  between,
  fillCloud,
  jitter,
  onBox,
  onCylinder,
  onSphere,
  pickIndex,
  type Cloud,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Digital consulting: a strategy turned into a roadmap. An idea (a lightbulb) sits over the
 * start; five milestone platforms climb towards a goal flag, joined by the route the plan
 * takes. Built idea first, then each milestone in turn, the route, and the flag last.
 * Milestone `i` carries tag `i + 1`, the idea 6, the flag 7.
 */
export const ROADMAP_BOUNDS: Vec3 = [2.45, 1.55, 1];

const STEPS: readonly Vec3[] = Array.from({ length: 5 }, (_, i): Vec3 => [
  -1.85 + i * 0.95,
  -1.1 + i * 0.42,
  i % 2 === 0 ? 0.25 : -0.25,
]);
const STEP_SIZE: Vec3 = [0.7, 0.14, 0.55];
const BULB: Vec3 = [-1.85, 0.75, 0.25];
const FLAG_BASE: Vec3 = [STEPS[4][0], STEPS[4][1] + 0.07, STEPS[4][2]];
const FLAG_POLE = 0.75;

const top = (step: Vec3): Vec3 => [step[0], step[1] + STEP_SIZE[1] / 2, step[2]];
const ROUTE: Vec3[] = STEPS.slice(0, -1).flatMap((step, i) =>
  arcPoints(top(step), top(STEPS[i + 1]), 0.35, 12)
);

const onBulb = (random: Random): Vec3 => {
  if (random() < 0.72) {
    return onSphere(random, 0.32, BULB);
  }
  if (random() < 0.6) {
    return onCylinder(random, [BULB[0], BULB[1] - 0.52, BULB[2]], 0.13, 0.22);
  }
  // The filament inside the glass.
  return jitter(
    random,
    [BULB[0] + between(random, -0.1, 0.1), BULB[1] - 0.05 + Math.sin(random() * 6) * 0.05, BULB[2]],
    0.01
  );
};

const onFlag = (random: Random): Vec3 => {
  if (random() < 0.4) {
    return [FLAG_BASE[0], FLAG_BASE[1] + random() * FLAG_POLE, FLAG_BASE[2]];
  }
  const u = random();
  const v = random() * (1 - u * 0.6);
  return [FLAG_BASE[0] + u * 0.45, FLAG_BASE[1] + FLAG_POLE - 0.3 * v - 0.02, FLAG_BASE[2]];
};

export const sampleRoadmap = (count: number, random: Random): Cloud => {
  const milestones = STEPS.map((centre, index) => ({
    weight: 1,
    tag: index + 1,
    sample: (r: Random) => onBox(r, centre, STEP_SIZE),
    order: () => 0.18 + index * 0.1 + 0.06 * random(),
  }));
  const cloud = fillCloud(
    count,
    [
      {
        weight: 1,
        tag: 6,
        sample: onBulb,
        order: (p) => 0.02 + 0.14 * ((p[1] - BULB[1] + 0.55) / 0.9),
      },
      ...milestones,
      {
        weight: 0.7,
        sample: (r) => jitter(r, ROUTE[pickIndex(r, ROUTE.length)], 0.01),
        order: (p) => 0.2 + 0.55 * ((p[0] + 1.85) / 3.8),
      },
      { weight: 0.4, tag: 7, sample: onFlag, order: () => 0.82 + 0.15 * random() },
    ],
    random
  );

  const lines = createLines();
  STEPS.forEach((centre, index) => {
    const from = 0.18 + index * 0.1;
    lines.box(centre, STEP_SIZE, from, from + 0.06);
  });
  STEPS.slice(0, -1).forEach((step, i) =>
    lines.path(
      arcPoints(top(step), top(STEPS[i + 1]), 0.35, 12),
      0.22 + i * 0.1,
      0.3 + i * 0.1,
      true
    )
  );
  lines.segment(FLAG_BASE, [FLAG_BASE[0], FLAG_BASE[1] + FLAG_POLE, FLAG_BASE[2]], 0.82);
  lines.path(
    [
      [FLAG_BASE[0], FLAG_BASE[1] + FLAG_POLE, FLAG_BASE[2]],
      [FLAG_BASE[0] + 0.45, FLAG_BASE[1] + FLAG_POLE - 0.15, FLAG_BASE[2]],
      [FLAG_BASE[0], FLAG_BASE[1] + FLAG_POLE - 0.32, FLAG_BASE[2]],
    ],
    0.86,
    0.95
  );
  lines.path(arcPoints([BULB[0], BULB[1] - 0.55, BULB[2]], top(STEPS[0]), 0, 6), 0.14, 0.18, true);
  return { ...cloud, lines: lines.build() };
};
