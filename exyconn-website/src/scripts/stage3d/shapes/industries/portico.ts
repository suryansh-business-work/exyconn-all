import type { LineBuilder } from "../lines";
import {
  between,
  onCylinder,
  onTriangle,
  pickIndex,
  type Part,
  type Random,
  type Vec3,
} from "../sampling";
import { GROUND, rise } from "./kit";

/**
 * A classical front shared by the bank, the courthouse and the school: three steps, a row of
 * columns, the beam across them and a pediment on top, with a wall and a door behind. It
 * builds bottom to top between `from` and `to`.
 */
export interface Portico {
  /** Centre of the colonnade on the ground. */
  x: number;
  z: number;
  width: number;
  columns: number;
  /** Column height above the steps. */
  height: number;
  /** How far the pediment's apex rises above the beam. */
  gable: number;
  from: number;
  to: number;
  /** Multiplies every part's weight. */
  weight?: number;
}

const STEP = 0.07;
const STEPS = 3;
const BEAM = 0.16;
const RADIUS = 0.055;

/** The heights a portico is built to: steps top, column tops, beam top and apex. */
export const porticoLevels = (p: Portico) => {
  const base = GROUND + STEP * STEPS;
  const top = base + p.height;
  const roof = top + BEAM;
  return { base, top, roof, apex: roof + p.gable, front: p.z + 0.14 };
};

const columnX = (p: Portico, i: number): number =>
  p.x - p.width / 2 + RADIUS + ((p.width - RADIUS * 2) * i) / (p.columns - 1);

/** Step `k` (0 at the bottom): [half width, front z, top y]. */
const step = (p: Portico, k: number): Vec3 => [
  p.width / 2 + 0.22 - k * 0.07,
  p.z + 0.42 - k * 0.09,
  GROUND + STEP * (k + 1),
];

const onSteps =
  (p: Portico) =>
  (r: Random): Vec3 => {
    const [half, front, y] = step(p, pickIndex(r, STEPS));
    const x = p.x + between(r, -half, half);
    if (r() < 0.5) {
      return [x, between(r, y - STEP, y), front];
    }
    return [x, y, between(r, front - 0.12, front)];
  };

const onColumns =
  (p: Portico) =>
  (r: Random): Vec3 => {
    const { base } = porticoLevels(p);
    return onCylinder(r, [columnX(p, pickIndex(r, p.columns)), base, p.z], RADIUS, p.height);
  };

const onBeam =
  (p: Portico) =>
  (r: Random): Vec3 => {
    const { top, roof, front } = porticoLevels(p);
    return [p.x + between(r, -0.55, 0.55) * (p.width + 0.16), between(r, top, roof), front];
  };

const onPediment =
  (p: Portico) =>
  (r: Random): Vec3 => {
    const { roof, apex, front } = porticoLevels(p);
    const half = p.width / 2 + 0.08;
    return onTriangle(r, [p.x - half, roof, front], [p.x + half, roof, front], [p.x, apex, front]);
  };

const onWall =
  (p: Portico) =>
  (r: Random): Vec3 => {
    const { base, top } = porticoLevels(p);
    return [p.x + between(r, -0.5, 0.5) * p.width, between(r, base, top), p.z - 0.3];
  };

/** The portico's points: steps, columns, beam, pediment and the wall behind. */
export const porticoParts = (p: Portico): Part[] => {
  const { apex } = porticoLevels(p);
  const order = rise(p.from, p.to, GROUND, apex - GROUND);
  const w = p.weight ?? 1;
  return [
    { weight: 0.45 * w, sample: onSteps(p), order },
    { weight: 1.3 * w, sample: onColumns(p), order },
    { weight: 0.4 * w, sample: onBeam(p), order },
    { weight: 0.35 * w, sample: onPediment(p), order },
    { weight: 0.3 * w, sample: onWall(p), order },
  ];
};

/** The portico's frame: the top step, the beam, the pediment's outline and the door. */
export const drawPortico = (lines: LineBuilder, p: Portico): void => {
  const { base, top, roof, apex, front } = porticoLevels(p);
  const at = (y: number) => rise(p.from, p.to, GROUND, apex - GROUND)([0, y, 0]);
  const [half, stepFront] = step(p, 0);
  lines.box(
    [p.x, GROUND + (STEP * STEPS) / 2, stepFront - 0.3],
    [half * 2, STEP * STEPS, 0.6],
    p.from,
    at(base)
  );
  lines.box([p.x, (top + roof) / 2, p.z], [p.width + 0.16, BEAM, 0.3], at(top), at(roof));
  const edge = p.width / 2 + 0.08;
  lines.path(
    [
      [p.x - edge, roof, front],
      [p.x, apex, front],
      [p.x + edge, roof, front],
    ],
    at(roof),
    at(apex)
  );
  const door = Math.min(0.2, p.width * 0.12);
  lines.path(
    [
      [p.x - door, base, p.z - 0.3],
      [p.x - door, base + p.height * 0.55, p.z - 0.3],
      [p.x + door, base + p.height * 0.55, p.z - 0.3],
      [p.x + door, base, p.z - 0.3],
    ],
    at(base),
    at(top)
  );
};
