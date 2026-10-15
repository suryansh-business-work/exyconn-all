import { gear } from "../../../../lib/detail/glyphs";
import type { GlyphPath } from "../glyph";
import { ICONS } from "./icons";
import { GROUND, onDrawing, onPolyline, rise, type IndustryLandmark } from "./kit";
import {
  between,
  onBox,
  onCylinder,
  onSphere,
  pickIndex,
  type Random,
  type Vec3,
} from "../sampling";

/**
 * Startups and SaaS: a rocket lifting off from an open laptop. The screen shows a support chat
 * and a usage line, the rocket climbs out of a puff of smoke above it with a cog in its
 * porthole, a cloud hangs behind on the left, a dashboard panel floats on the right and a
 * credit card lies beside the keyboard. Use cases: in-app support lands on the screen's chat,
 * demo booking on the dashboard panel, answers from docs on the cloud, billing on the card,
 * usage and churn on the screen's chart and AI features on the rocket's porthole.
 */
const HINGE_Y = GROUND + 0.06;
const HINGE_Z = -0.05;
const HALF_WIDTH = 0.72;
const SCREEN = 0.92;
const TILT = 0.22;

/** A point on the screen: `u` across (-1 to 1), `v` up (0 at the hinge to 1 at the top). */
const screenAt = (u: number, v: number): Vec3 => [
  u * HALF_WIDTH,
  HINGE_Y + v * SCREEN * Math.cos(TILT),
  HINGE_Z - v * SCREEN * Math.sin(TILT),
];

/** A 2D drawing laid on the screen, centred at (u, v), `scale` world units per drawing unit. */
const onScreen = (
  r: Random,
  paths: readonly GlyphPath[],
  u: number,
  v: number,
  scale: number
): Vec3 => {
  const path = paths[pickIndex(r, paths.length)];
  const points = path.map(([x, y]) =>
    screenAt(u + (x * scale) / HALF_WIDTH, v + (y * scale) / SCREEN)
  );
  return onPolyline(r, points, 0.006);
};

const laptop = (r: Random): Vec3 => {
  const pick = r();
  if (pick < 0.25) {
    return onBox(r, [0, GROUND + 0.03, 0.3], [HALF_WIDTH * 2, 0.05, 0.7]);
  }
  if (pick < 0.55) {
    const x = -0.6 + pickIndex(r, 13) * 0.1;
    const z = 0.02 + pickIndex(r, 4) * 0.08;
    return [x + between(r, -0.02, 0.02), HINGE_Y + 0.002, z + between(r, -0.015, 0.015)];
  }
  return screenAt(between(r, -1, 1), r());
};

const SPARKLINE: GlyphPath[] = [
  Array.from(
    { length: 9 },
    (_, i) => [-1 + i / 4, 0.6 * Math.sin(i * 1.3) * (1 - i / 12) + i / 10] as const
  ),
];
const chat = (r: Random): Vec3 => onScreen(r, ICONS.chat, -0.55, 0.7, 0.17);
const usage = (r: Random): Vec3 => onScreen(r, SPARKLINE, -0.5, 0.3, 0.2);

const ROCKET_BASE = GROUND + 1.28;
const BODY = 0.72;
const RADIUS = 0.14;
const PORTHOLE: Vec3 = [0, ROCKET_BASE + 0.48, RADIUS + 0.01];
const rocket = (r: Random): Vec3 => {
  const pick = r();
  if (pick < 0.55) {
    return onCylinder(r, [0, ROCKET_BASE, 0], RADIUS, BODY);
  }
  if (pick < 0.8) {
    const t = 1 - Math.sqrt(r());
    const angle = r() * Math.PI * 2;
    const radius = RADIUS * (1 - t) ** 0.7 + 0.004;
    return [radius * Math.cos(angle), ROCKET_BASE + BODY + t * 0.32, radius * Math.sin(angle)];
  }
  const fin = (pickIndex(r, 3) / 3) * Math.PI * 2 + Math.PI / 2;
  const out = between(r, 0, 0.16) * r();
  const y = ROCKET_BASE + between(r, 0, 0.26 - out);
  return [(RADIUS + out) * Math.cos(fin), y - out * 0.6, (RADIUS + out) * Math.sin(fin)];
};

const COG: GlyphPath[] = [gear(0, 0, 1, 0.75, 8)];
const porthole = (r: Random): Vec3 => onDrawing(r, COG, PORTHOLE, 0.075);

/** Flame under the rocket, then smoke billowing round the top of the screen. */
const exhaust = (r: Random): Vec3 => {
  if (r() < 0.35) {
    const t = r();
    const angle = r() * Math.PI * 2;
    const radius = 0.1 * (1 - t);
    return [radius * Math.cos(angle), ROCKET_BASE - 0.32 * t, radius * Math.sin(angle)];
  }
  const k = pickIndex(r, 5);
  const centre: Vec3 = [(k - 2) * 0.17, HINGE_Y + 1.02 + 0.06 * (2 - Math.abs(k - 2)), -0.15];
  return onSphere(r, 0.14 - 0.02 * Math.abs(k - 2), centre);
};

/** Three overlapping puffs with a flat base, front halves only. */
const PUFFS: readonly [Vec3, number][] = [
  [[-1.25, GROUND + 1.85, -0.75], 0.24],
  [[-0.95, GROUND + 1.95, -0.75], 0.32],
  [[-0.65, GROUND + 1.85, -0.75], 0.22],
];
const cloud = (r: Random): Vec3 => {
  const [centre, radius] = PUFFS[pickIndex(r, PUFFS.length)];
  const [x, y, z] = onSphere(r, radius, centre);
  return [x, Math.max(y, GROUND + 1.72), centre[2] + Math.abs(z - centre[2])];
};

/** A dashboard panel: a frame round a grid of tiles. */
const PANEL: Vec3 = [1.25, GROUND + 0.95, 0.15];
const panel = (r: Random): Vec3 => {
  if (r() < 0.4) {
    return onBox(r, PANEL, [0.6, 0.45, 0.02]);
  }
  const cell: Vec3 = [
    PANEL[0] - 0.2 + pickIndex(r, 4) * 0.13,
    PANEL[1] - 0.13 + pickIndex(r, 3) * 0.12,
    PANEL[2] + 0.02,
  ];
  return onBox(r, cell, [0.08, 0.07, 0.001]);
};

const CARD: Vec3 = [1.1, GROUND + 0.02, 0.75];
const card = (r: Random): Vec3 => onBox(r, CARD, [0.48, 0.02, 0.3]);

export const SAAS: IndustryLandmark = {
  parts: [
    { weight: 2.2, sample: laptop, order: rise(0.08, 0.28, GROUND, 1) },
    { weight: 0.25, tag: 1, sample: chat, order: () => 0.3 },
    { weight: 0.2, tag: 5, sample: usage, order: () => 0.32 },
    { weight: 0.6, tag: 3, sample: cloud, order: () => 0.34 },
    { weight: 0.45, sample: panel, order: () => 0.38 },
    { weight: 0.25, tag: 4, sample: card, order: () => 0.4 },
    { weight: 0.7, sample: exhaust, order: rise(0.42, 0.5, GROUND + 0.9, 0.5) },
    { weight: 1.2, sample: rocket, order: rise(0.48, 0.6, ROCKET_BASE, 1.1) },
    { weight: 0.15, tag: 6, sample: porthole, order: () => 0.62 },
  ],
  draw: (lines) => {
    lines.box([0, GROUND + 0.03, 0.3], [HALF_WIDTH * 2, 0.05, 0.7], 0.08, 0.12);
    lines.path([screenAt(-1, 0), screenAt(-1, 1), screenAt(1, 1), screenAt(1, 0)], 0.12, 0.28);
    lines.box(PANEL, [0.6, 0.45, 0.02], 0.36, 0.38);
  },
  icons: ["chat", "calendar", "search", "card", "chart", "gear"],
  anchors: [
    screenAt(-0.55, 0.7),
    [PANEL[0] - 0.3, PANEL[1], PANEL[2]],
    [-0.95, GROUND + 1.9, -0.45],
    [CARD[0], CARD[1], CARD[2]],
    screenAt(-0.5, 0.3),
    PORTHOLE,
  ],
};
