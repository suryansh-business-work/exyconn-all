import { arc, box, circle, line, roundedRect } from "../../../../lib/detail/glyphs";
import type { GlyphPath } from "../glyph";

/**
 * The use-case markers that float round an industry scene: small line drawings in a [-1, 1]
 * square (y up), one per thing the AI does there — a chat for guest messages, a calendar for
 * bookings, a star for reviews. Every industry picks six; the kit draws each one facing the
 * camera inside a halo and wires it to the landmark.
 */
export const ICONS = {
  chat: [
    roundedRect(-0.8, -0.3, 0.8, 0.75, 0.2),
    line([-0.45, -0.3], [-0.6, -0.75], [-0.1, -0.3]),
    line([-0.45, 0.35], [0.45, 0.35]),
    line([-0.45, 0.08], [0.2, 0.08]),
  ],
  calendar: [
    box(-0.8, -0.8, 0.8, 0.6),
    line([-0.8, 0.25], [0.8, 0.25]),
    line([-0.4, 0.8], [-0.4, 0.45]),
    line([0.4, 0.8], [0.4, 0.45]),
    box(-0.5, -0.45, -0.15, -0.1),
    box(0.15, -0.45, 0.5, -0.1),
  ],
  star: [
    line(
      ...Array.from({ length: 11 }, (_, i) => {
        const angle = Math.PI / 2 + (i * Math.PI) / 5;
        const radius = i % 2 === 0 ? 0.85 : 0.36;
        return [radius * Math.cos(angle), radius * Math.sin(angle)] as const;
      })
    ),
  ],
  bell: [
    arc(0, 0.05, 0.55, 0, Math.PI, 16),
    line([-0.55, 0.05], [-0.7, -0.45], [0.7, -0.45], [0.55, 0.05]),
    arc(0, -0.55, 0.15, Math.PI, Math.PI * 2, 8),
    line([0, 0.6], [0, 0.78]),
  ],
  document: [
    line([-0.6, -0.85], [-0.6, 0.85], [0.3, 0.85], [0.6, 0.55], [0.6, -0.85], [-0.6, -0.85]),
    line([0.3, 0.85], [0.3, 0.55], [0.6, 0.55]),
    line([-0.35, 0.3], [0.35, 0.3]),
    line([-0.35, 0], [0.35, 0]),
    line([-0.35, -0.3], [0.15, -0.3]),
  ],
  chart: [
    line([-0.8, 0.8], [-0.8, -0.8], [0.8, -0.8]),
    box(-0.55, -0.8, -0.3, -0.3),
    box(-0.1, -0.8, 0.15, 0),
    box(0.35, -0.8, 0.6, 0.45),
  ],
  phone: [
    roundedRect(-0.45, -0.85, 0.45, 0.85, 0.12),
    line([-0.12, 0.7], [0.12, 0.7]),
    circle(0, -0.65, 0.07, 10),
  ],
  shield: [
    line([0, 0.85], [0.7, 0.55], [0.6, -0.2], [0, -0.85], [-0.6, -0.2], [-0.7, 0.55], [0, 0.85]),
    line([-0.3, 0], [-0.05, -0.28], [0.35, 0.25]),
  ],
  coin: [circle(0, 0, 0.8, 28), circle(0, 0, 0.58, 24), line([0, 0.35], [0, -0.35])],
  clock: [circle(0, 0, 0.8, 28), line([0, 0.5], [0, 0], [0.35, -0.2])],
  pin: [
    arc(0, 0.25, 0.55, -Math.PI * 0.18, Math.PI * 1.18, 24),
    line([-0.47, -0.05], [0, -0.85], [0.47, -0.05]),
    circle(0, 0.25, 0.2, 12),
  ],
  cart: [
    line([-0.85, 0.65], [-0.6, 0.65], [-0.35, -0.3], [0.6, -0.3], [0.8, 0.35], [-0.5, 0.35]),
    circle(-0.25, -0.6, 0.13, 10),
    circle(0.45, -0.6, 0.13, 10),
  ],
  mail: [box(-0.85, -0.55, 0.85, 0.55), line([-0.85, 0.55], [0, -0.1], [0.85, 0.55])],
  gear: [
    line(
      ...Array.from({ length: 33 }, (_, i) => {
        const angle = (i * Math.PI) / 16;
        const radius = Math.floor(i / 2) % 2 === 0 ? 0.82 : 0.6;
        return [radius * Math.cos(angle), radius * Math.sin(angle)] as const;
      })
    ),
    circle(0, 0, 0.25, 12),
  ],
  person: [circle(0, 0.4, 0.32, 16), arc(0, -0.75, 0.7, 0, Math.PI, 16)],
  check: [circle(0, 0, 0.8, 28), line([-0.4, 0], [-0.1, -0.3], [0.45, 0.32])],
  card: [
    roundedRect(-0.85, -0.55, 0.85, 0.55, 0.1),
    line([-0.85, 0.22], [0.85, 0.22]),
    line([-0.6, -0.25], [-0.15, -0.25]),
  ],
  parcel: [
    line([-0.75, 0.35], [0, 0.7], [0.75, 0.35], [0, 0], [-0.75, 0.35]),
    line([-0.75, 0.35], [-0.75, -0.45], [0, -0.85], [0.75, -0.45], [0.75, 0.35]),
    line([0, 0], [0, -0.85]),
  ],
  mic: [
    roundedRect(-0.25, -0.15, 0.25, 0.85, 0.25),
    arc(0, 0.05, 0.5, Math.PI, Math.PI * 2, 16),
    line([0, -0.45], [0, -0.85]),
    line([-0.3, -0.85], [0.3, -0.85]),
  ],
  key: [
    circle(-0.45, 0.3, 0.32, 16),
    line([-0.22, 0.08], [0.7, -0.75]),
    line([0.35, -0.42], [0.55, -0.22]),
    line([0.52, -0.58], [0.72, -0.38]),
  ],
  search: [circle(-0.15, 0.15, 0.55, 24), line([0.25, -0.25], [0.8, -0.8])],
  route: [
    circle(-0.6, -0.6, 0.15, 10),
    circle(0.6, 0.6, 0.15, 10),
    line([-0.45, -0.6], [0.3, -0.6], [0.3, 0], [-0.3, 0], [-0.3, 0.6], [0.45, 0.6]),
  ],
  megaphone: [
    line([-0.75, -0.2], [-0.75, 0.25], [0.6, 0.75], [0.6, -0.7], [-0.75, -0.2]),
    line([-0.45, -0.3], [-0.3, -0.8], [-0.05, -0.75], [-0.15, -0.4]),
  ],
  ticket: [
    line(
      [-0.85, 0.45],
      [0.85, 0.45],
      [0.85, 0.15],
      [0.7, 0],
      [0.85, -0.15],
      [0.85, -0.45],
      [-0.85, -0.45],
      [-0.85, -0.15],
      [-0.7, 0],
      [-0.85, 0.15],
      [-0.85, 0.45]
    ),
    line([0.25, 0.35], [0.25, -0.35]),
  ],
  heart: [
    line(
      ...Array.from({ length: 33 }, (_, i) => {
        const t = (i / 32) * Math.PI * 2;
        const x = 16 * Math.sin(t) ** 3;
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        return [x / 19, y / 19 + 0.1] as const;
      })
    ),
  ],
  wrench: [
    arc(-0.45, 0.45, 0.35, -Math.PI * 0.2, Math.PI * 1.3, 16),
    line([-0.2, 0.2], [0.75, -0.75]),
  ],
} as const satisfies Record<string, readonly GlyphPath[]>;

export type IconName = keyof typeof ICONS;
