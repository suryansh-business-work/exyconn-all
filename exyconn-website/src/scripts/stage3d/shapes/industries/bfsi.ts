import { circle, line } from "../../../../lib/detail/glyphs";
import { onCylinder, pickIndex, type Random, type Vec3 } from "../sampling";
import { GROUND, onDisc, onDrawing, rise, type IndustryLandmark } from "./kit";
import { drawPortico, porticoLevels, porticoParts, type Portico } from "./portico";

/**
 * BFSI: a bank. Steps lead up to a row of six columns under a pediment; stacks of coins stand
 * to the right and a round vault door, wheel and bolts, to the left. Use cases: customer
 * service lands on the front door, KYC checks on the pediment, loans and claims on the
 * left colonnade, collections on the coins, fraud flags on the vault and regulatory reports on
 * the right colonnade.
 */
const BANK: Portico = {
  x: 0.05,
  z: -0.2,
  width: 1.5,
  columns: 6,
  height: 1.25,
  gable: 0.45,
  from: 0.08,
  to: 0.5,
  weight: 2,
};
const LEVELS = porticoLevels(BANK);

const COIN = 0.055;
const COIN_RADIUS = 0.13;
/** Coin stacks: [x, z, coins]. */
const STACKS: readonly Vec3[] = [
  [1.3, 0.62, 8],
  [1.52, 0.3, 6],
  [1.5, 0.88, 4],
];

/** Each coin is its rim edges, so a stack reads as separate coins; the top one shows its face. */
const coins = (r: Random): Vec3 => {
  const [x, z, count] = STACKS[pickIndex(r, STACKS.length)];
  const k = pickIndex(r, count);
  if (k === count - 1 && r() < 0.4) {
    return onDisc(r, [x, GROUND + count * COIN, z], COIN_RADIUS * 0.7);
  }
  const y = GROUND + k * COIN + 0.01;
  return onCylinder(r, [x, y, z], COIN_RADIUS, 0.004);
};

const VAULT: Vec3 = [-1.28, GROUND + 0.4, 0.68];
const VAULT_SCALE = 0.34;
const SPOKES = [0, 1, 2].map((i) => {
  const a = (i * Math.PI) / 3;
  return line([-0.55 * Math.cos(a), -0.55 * Math.sin(a)], [0.55 * Math.cos(a), 0.55 * Math.sin(a)]);
});
const BOLTS = Array.from({ length: 4 }, (_, i) => {
  const a = ((i + 0.5) * Math.PI) / 2;
  return circle(0.89 * Math.cos(a), 0.89 * Math.sin(a), 0.045, 6);
});
const DOOR = [circle(0, 0, 1, 36)];
const FRAME = [line([-1.15, -1.15], [1.15, -1.15], [1.15, 1.15], [-1.15, 1.15], [-1.15, -1.15])];
const WHEEL = [circle(0, 0, 0.15, 10), ...SPOKES];

/** The door's rings, frame, wheel and bolts, with its thickness as a ring behind. */
const vault = (r: Random): Vec3 => {
  const pick = r();
  if (pick < 0.15) {
    return onDrawing(r, DOOR, [VAULT[0], VAULT[1], VAULT[2] - 0.1], VAULT_SCALE);
  }
  if (pick < 0.45) {
    return onDrawing(r, DOOR, VAULT, VAULT_SCALE);
  }
  if (pick < 0.6) {
    return onDrawing(r, FRAME, VAULT, VAULT_SCALE);
  }
  if (pick < 0.88) {
    return onDrawing(r, WHEEL, VAULT, VAULT_SCALE);
  }
  return onDrawing(r, BOLTS, VAULT, VAULT_SCALE);
};

export const BFSI: IndustryLandmark = {
  parts: [
    ...porticoParts(BANK),
    { weight: 0.55, tag: 4, sample: coins, order: rise(0.42, 0.56, GROUND, 0.45) },
    { weight: 0.5, tag: 5, sample: vault, order: () => 0.58 },
  ],
  draw: (lines) => drawPortico(lines, BANK),
  icons: ["chat", "document", "check", "bell", "shield", "chart"],
  anchors: [
    [-0.05, LEVELS.base + 0.65, BANK.z - 0.3],
    [0.3, LEVELS.roof + 0.12, LEVELS.front],
    [-0.45, LEVELS.base + 0.5, BANK.z + 0.06],
    [1.3, GROUND + 8 * COIN, 0.62],
    [VAULT[0] + 0.1, VAULT[1], VAULT[2]],
    [0.62, LEVELS.base + 0.35, BANK.z + 0.06],
  ],
};
