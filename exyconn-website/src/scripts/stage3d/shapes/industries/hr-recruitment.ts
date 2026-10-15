import { circle, line, roundedRect } from "../../../../lib/detail/glyphs";
import {
  drawBlock,
  GROUND,
  onDrawing,
  onFacade,
  onPerson,
  rise,
  ringPoints,
  type Block,
  type IndustryLandmark,
} from "./kit";
import { onCylinder, onSegment, pickIndex, type Random, type Vec3 } from "../sampling";

/**
 * HR and recruitment: a hiring funnel. Candidates step into the top of a funnel of stacked
 * rings that narrow stage by stage, and one hired person stands under its spout; an office
 * block rises behind and an ID badge on a lanyard hangs in front. Use cases: sourcing and
 * screening land on the candidates at the top, interview scheduling on the office's upper
 * floors, candidate Q&A on the funnel's middle stage, onboarding documents on the badge, the
 * employee helpdesk on the hired person and hiring analytics on the office's lower floors.
 */
const FUNNEL: Vec3 = [-0.2, GROUND, 0.25];
/** Each stage: [height above the ground, radius]. */
const STAGES: readonly (readonly [number, number])[] = [
  [2.15, 0.78],
  [1.82, 0.6],
  [1.5, 0.43],
  [1.2, 0.28],
  [0.94, 0.14],
];
const SPOUT_BOTTOM = 0.62;
const stageAt = (k: number): Vec3 => [FUNNEL[0], GROUND + STAGES[k][0], FUNNEL[2]];
/** The funnel builds from its mouth down to the spout, the way candidates move through it. */
const funnelOrder = rise(0.42, 0.18, GROUND + 0.6, 1.6);

const funnel = (r: Random): Vec3 => {
  const k = pickIndex(r, STAGES.length);
  const [height, radius] = STAGES[k];
  if (r() < 0.7) {
    return onCylinder(r, [FUNNEL[0], GROUND + height - 0.03, FUNNEL[2]], radius, 0.06);
  }
  if (k === STAGES.length - 1) {
    return onCylinder(
      r,
      [FUNNEL[0], GROUND + SPOUT_BOTTOM, FUNNEL[2]],
      radius * 0.8,
      height - SPOUT_BOTTOM
    );
  }
  const angle = r() * Math.PI * 2;
  const [nextHeight, nextRadius] = STAGES[k + 1];
  const t = r();
  const reach = radius + (nextRadius - radius) * t;
  return [
    FUNNEL[0] + reach * Math.cos(angle),
    GROUND + height + (nextHeight - height) * t,
    FUNNEL[2] + reach * Math.sin(angle),
  ];
};

const TOP = GROUND + STAGES[0][0];
const CANDIDATES: readonly Vec3[] = [
  [FUNNEL[0] - 0.5, TOP + 0.16, FUNNEL[2] + 0.1],
  [FUNNEL[0] - 0.17, TOP + 0.24, FUNNEL[2] + 0.2],
  [FUNNEL[0] + 0.17, TOP + 0.2, FUNNEL[2] + 0.05],
  [FUNNEL[0] + 0.5, TOP + 0.14, FUNNEL[2] + 0.12],
];
const HIRED: Vec3 = [FUNNEL[0], GROUND + 0.18, FUNNEL[2] + 0.1];

const OFFICE: Block = [0.9, -0.75, 1.1, 0.6, 2];
const OFFICE_FRONT = OFFICE[1] + OFFICE[3] / 2;

/** An ID badge hanging from a lanyard: photo, name lines, and the strap. */
const BADGE: Vec3 = [0.88, GROUND + 0.42, 0.85];
const BADGE_SCALE = 0.22;
const BADGE_CARD = [
  roundedRect(-0.75, -1, 0.75, 1, 0.15),
  line([-0.2, 0.82], [0.2, 0.82]),
  circle(0, 0.32, 0.3, 14),
  line([-0.45, -0.25], [0.45, -0.25]),
  line([-0.35, -0.5], [0.35, -0.5]),
];
const LANYARD_TOP: Vec3 = [BADGE[0], BADGE[1] + 0.6, BADGE[2] - 0.08];
const badge = (r: Random): Vec3 => {
  if (r() < 0.25) {
    const side = r() < 0.5 ? -0.12 : 0.12;
    return onSegment(r, [BADGE[0] + side, BADGE[1] + BADGE_SCALE, BADGE[2]], LANYARD_TOP);
  }
  return onDrawing(r, BADGE_CARD, BADGE, BADGE_SCALE);
};

export const HR_RECRUITMENT: IndustryLandmark = {
  parts: [
    { weight: 2.2, sample: (r) => onFacade(r, OFFICE, 0.14, 0.13), order: rise(0.08, 0.3) },
    { weight: 2.2, sample: funnel, order: funnelOrder },
    { weight: 0.45, tag: 4, sample: badge, order: () => 0.5 },
    ...CANDIDATES.map((at, i) => ({
      weight: 0.12,
      tag: 1,
      sample: (r: Random) => onPerson(r, at, 0.8),
      order: () => 0.52 + i * 0.015,
    })),
    { weight: 0.2, tag: 5, sample: (r: Random) => onPerson(r, HIRED, 1.4), order: () => 0.62 },
  ],
  draw: (lines) => {
    drawBlock(lines, OFFICE, 0.08, 0.3);
    STAGES.forEach(([, radius], k) => {
      const at = funnelOrder(stageAt(k));
      lines.path(ringPoints(stageAt(k), radius), at, at + 0.02);
    });
    [0, 1, 2, 3].forEach((i) => {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const edge = (k: number): Vec3 => {
        const [height, radius] = STAGES[k];
        return [
          FUNNEL[0] + radius * Math.cos(angle),
          GROUND + height,
          FUNNEL[2] + radius * Math.sin(angle),
        ];
      };
      lines.path([edge(0), edge(4)], 0.18, 0.4);
    });
  },
  icons: ["search", "calendar", "chat", "document", "person", "chart"],
  anchors: [
    [CANDIDATES[0][0], CANDIDATES[0][1] + 0.05, CANDIDATES[0][2]],
    [OFFICE[0] + 0.25, GROUND + 1.65, OFFICE_FRONT],
    [FUNNEL[0] - STAGES[2][1], GROUND + STAGES[2][0], FUNNEL[2]],
    [BADGE[0], BADGE[1], BADGE[2]],
    [HIRED[0], HIRED[1] + 0.05, HIRED[2]],
    [OFFICE[0] + 0.4, GROUND + 0.5, OFFICE_FRONT],
  ],
};
