import type { GlyphPath, GlyphPoint } from "../../scripts/stage3d/shapes/glyph";

/**
 * The 2D marks the detail pages' stages draw with the `glyph` shape: line drawings in a
 * [-1, 1] square (y up). Path `i` becomes scene tag `i + 1`, so the order decides what a
 * hovered card lights.
 */
const TAU = Math.PI * 2;
const ROUND = 1000;
/** Three decimals, and never -0. */
const round = (value: number): number => Math.round(value * ROUND) / ROUND + 0;
const point = (x: number, y: number): GlyphPoint => [round(x), round(y)];

/** An arc from angle `from` to `to` (radians, counter-clockwise from +x). */
export const arc = (
  cx: number,
  cy: number,
  r: number,
  from: number,
  to: number,
  steps = 24
): GlyphPath =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const angle = from + ((to - from) * i) / steps;
    return point(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  });

export const circle = (cx: number, cy: number, r: number, steps = 32): GlyphPath =>
  arc(cx, cy, r, 0, TAU, steps);

/** A closed rectangle with rounded corners, (x0, y0) bottom left to (x1, y1) top right. */
export const roundedRect = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number
): GlyphPath => {
  const corner = (cx: number, cy: number, start: number) =>
    arc(cx, cy, r, start, start + Math.PI / 2, 6);
  const path = [
    ...corner(x1 - r, y0 + r, -Math.PI / 2),
    ...corner(x1 - r, y1 - r, 0),
    ...corner(x0 + r, y1 - r, Math.PI / 2),
    ...corner(x0 + r, y0 + r, Math.PI),
  ];
  return [...path, path[0]];
};

/** A cog: `teeth` square teeth between radii `inner` and `outer`. */
export const gear = (
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  teeth: number
): GlyphPath => {
  const step = TAU / teeth;
  const path = Array.from({ length: teeth }, (_, i) => {
    const a = i * step;
    return [
      point(cx + inner * Math.cos(a), cy + inner * Math.sin(a)),
      point(cx + outer * Math.cos(a + step * 0.15), cy + outer * Math.sin(a + step * 0.15)),
      point(cx + outer * Math.cos(a + step * 0.45), cy + outer * Math.sin(a + step * 0.45)),
      point(cx + inner * Math.cos(a + step * 0.6), cy + inner * Math.sin(a + step * 0.6)),
    ];
  }).flat();
  return [...path, path[0]];
};

const line = (...points: readonly (readonly [number, number])[]): GlyphPath =>
  points.map(([x, y]) => point(x, y));

const box = (x0: number, y0: number, x1: number, y1: number): GlyphPath =>
  line([x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]);

/** A speech bubble with a tail under its left third. */
const bubble = (x0: number, y0: number, x1: number, y1: number): GlyphPath[] => {
  const tail = x0 + (x1 - x0) * 0.25;
  return [
    roundedRect(x0, y0, x1, y1, 0.1),
    line([tail, y0], [tail - 0.08, y0 - 0.14], [tail + 0.12, y0]),
  ];
};

export const GLYPHS = {
  /** Bot creation: one conversation splitting into web, chat-app and voice bubbles. */
  chatBubbles: [
    ...bubble(-0.6, 0.15, 0.45, 0.9),
    ...bubble(-0.6, -0.85, -0.15, -0.4),
    ...bubble(-0.05, -0.85, 0.4, -0.4),
    ...bubble(0.5, -0.85, 0.95, -0.4),
    circle(-0.375, -0.62, 0.11, 16),
    line([0.07, -0.62], [0.28, -0.62]),
    line([0.64, -0.7], [0.64, -0.55]),
    line([0.725, -0.75], [0.725, -0.5]),
    line([0.81, -0.68], [0.81, -0.57]),
    line([-0.35, 0.58], [0.2, 0.58]),
    line([-0.35, 0.42], [0, 0.42]),
  ],
  /** Application modernization: two arrows turning around a core. */
  rotate: [
    arc(0, 0, 0.78, Math.PI * 0.12, Math.PI * 0.88),
    arc(0, 0, 0.78, Math.PI * 1.12, Math.PI * 1.88),
    line([-0.55, 0.42], [-0.72, 0.29], [-0.86, 0.48]),
    line([0.55, -0.42], [0.72, -0.29], [0.86, -0.48]),
    roundedRect(-0.28, -0.28, 0.28, 0.28, 0.06),
  ],
  /** Automation & integration: a plug and its cord. */
  plug: [
    roundedRect(-0.45, -0.15, 0.45, 0.45, 0.12),
    line([-0.2, 0.45], [-0.2, 0.85]),
    line([0.2, 0.45], [0.2, 0.85]),
    line([0, -0.15], [0, -0.45], [0.3, -0.7], [0.75, -0.85]),
  ],
  /** Data analytics: bars on axes with a trend line. */
  chart: [
    line([-0.85, 0.85], [-0.85, -0.85], [0.85, -0.85]),
    box(-0.65, -0.85, -0.4, -0.35),
    box(-0.25, -0.85, 0, -0.1),
    box(0.15, -0.85, 0.4, -0.25),
    box(0.55, -0.85, 0.8, 0.3),
    line([-0.6, -0.1], [-0.15, 0.25], [0.25, 0.05], [0.7, 0.7]),
  ],
  /** Digital consulting: a lightbulb with rays. */
  bulb: [
    arc(0, 0.3, 0.5, -Math.PI * 0.25, Math.PI * 1.25, 32),
    line([-0.35, -0.05], [-0.22, -0.45], [0.22, -0.45], [0.35, -0.05]),
    line([-0.2, -0.6], [0.2, -0.6]),
    line([-0.12, -0.75], [0.12, -0.75]),
    line([-0.8, 0.3], [-0.65, 0.3]),
    line([0.65, 0.3], [0.8, 0.3]),
    line([0, 0.95], [0, 0.85]),
  ],
  /** Enterprise applications: a building with a grid of windows. */
  building: [
    box(-0.6, -0.9, 0.6, 0.85),
    ...[0.55, 0.25, -0.05, -0.35].flatMap((y) =>
      [-0.4, -0.08, 0.24].map((x) => box(x, y, x + 0.16, y + 0.16))
    ),
    box(-0.12, -0.9, 0.12, -0.6),
  ],
  /** Maintenance: a cog around a hub. */
  cog: [gear(0, 0, 0.9, 0.7, 10), circle(0, 0, 0.3, 24)],
  /** Mobile app development: a phone. */
  phone: [
    roundedRect(-0.45, -0.92, 0.45, 0.92, 0.14),
    box(-0.36, -0.68, 0.36, 0.7),
    line([-0.1, 0.8], [0.1, 0.8]),
    circle(0, -0.8, 0.06, 12),
  ],
  /** Software as a service: a cloud with an upload arrow. */
  cloud: [
    [
      ...line([-0.6, -0.35]),
      ...arc(-0.6, -0.05, 0.3, Math.PI * 1.5, Math.PI * 0.6, 12),
      ...arc(-0.1, 0.25, 0.42, Math.PI * 0.95, Math.PI * 0.1, 16),
      ...arc(0.5, -0.02, 0.33, Math.PI * 0.6, -Math.PI / 2, 12),
      ...line([-0.6, -0.35]),
    ],
    line([0, -0.85], [0, -0.05]),
    line([-0.2, -0.25], [0, -0.05], [0.2, -0.25]),
  ],
} satisfies Record<string, readonly GlyphPath[]>;

export type GlyphId = keyof typeof GLYPHS;
