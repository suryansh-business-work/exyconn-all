import {
  between,
  onBox,
  onCylinder,
  onSegment,
  onSphere,
  pickIndex,
  type Random,
  type Vec3,
} from "../sampling";
import { GROUND, onDisc, onPolyline, rise, ringPoints, type IndustryLandmark } from "./kit";
import { drawPortico, porticoLevels, porticoParts, type Portico } from "./portico";

/**
 * Legal: the scales of justice in front of a courthouse. A tall post holds a balanced beam
 * with a pan hanging from each end; behind it a low colonnade under a pediment, a stack of
 * case files to the right and an hourglass to the left. Use cases: client intake lands on the
 * pediment's left side and deadlines on its right side, contract review on the files,
 * precedent research on the left pan, time tracking on the hourglass and confidentiality on
 * the right pan.
 */
const COURT: Portico = {
  x: 0,
  z: -0.6,
  width: 2.2,
  columns: 8,
  height: 1.05,
  gable: 0.35,
  from: 0.08,
  to: 0.36,
  weight: 1,
};
const LEVELS = porticoLevels(COURT);

const SCALES_Z = 0.3;
const POST_TOP = GROUND + 2.4;
const BEAM_Y = GROUND + 2.2;
const ARM = 0.8;
const PAN_Y = GROUND + 1.25;
const PAN_RADIUS = 0.27;

const scalesStand = (r: Random): Vec3 => {
  const pick = r();
  if (pick < 0.2) {
    return onDisc(r, [0, GROUND + 0.08, SCALES_Z], 0.24);
  }
  if (pick < 0.35) {
    return onCylinder(r, [0, GROUND, SCALES_Z], 0.24, 0.08);
  }
  if (pick < 0.85) {
    return onCylinder(r, [0, GROUND + 0.08, SCALES_Z], 0.028, POST_TOP - GROUND - 0.08);
  }
  return onSphere(r, 0.06, [0, POST_TOP + 0.05, SCALES_Z]);
};

const beam = (r: Random): Vec3 => {
  if (r() < 0.2) {
    return onSphere(r, 0.045, [0, BEAM_Y, SCALES_Z + 0.04]);
  }
  const x = between(r, -ARM, ARM);
  return [x, BEAM_Y + between(r, -0.018, 0.018) + 0.03 * Math.cos((x / ARM) * Math.PI), SCALES_Z];
};

/** A pan: three chains from the beam's end down to a shallow bowl. */
const pan =
  (side: number) =>
  (r: Random): Vec3 => {
    const x = side * ARM;
    const pick = r();
    if (pick < 0.35) {
      const angle = (pickIndex(r, 3) / 3) * Math.PI * 2 + 0.5;
      const rim: Vec3 = [
        x + PAN_RADIUS * Math.cos(angle),
        PAN_Y,
        SCALES_Z + PAN_RADIUS * Math.sin(angle),
      ];
      return onSegment(r, [x, BEAM_Y, SCALES_Z], rim);
    }
    if (pick < 0.6) {
      return onPolyline(r, ringPoints([x, PAN_Y, SCALES_Z], PAN_RADIUS), 0.005);
    }
    const [px, , pz] = onDisc(r, [x, PAN_Y, SCALES_Z], PAN_RADIUS);
    const reach = Math.hypot(px - x, pz - SCALES_Z) / PAN_RADIUS;
    return [px, PAN_Y - 0.1 * (1 - reach * reach), pz];
  };

/** Case files: thin folders stacked a little askew. */
const FILES: Vec3 = [1.2, GROUND, 0.55];
const FOLDER = 0.065;
const files = (r: Random): Vec3 => {
  const k = pickIndex(r, 6);
  const shift = 0.05 * Math.sin(k * 1.9);
  const y = FILES[1] + (k + 0.5) * FOLDER;
  if (k < 5 && r() < 0.75) {
    const x = FILES[0] + shift + between(r, -0.27, 0.27);
    return [x, y + between(r, -0.02, 0.02), FILES[2] - shift + 0.2];
  }
  return onBox(r, [FILES[0] + shift, y, FILES[2] - shift], [0.55, FOLDER * 0.6, 0.4]);
};

/** An hourglass: two glass bulbs between round plates, sand settled in the lower one. */
const GLASS: Vec3 = [-1.25, GROUND, 0.6];
const GLASS_HEIGHT = 0.62;
const hourglass = (r: Random): Vec3 => {
  const pick = r();
  if (pick < 0.25) {
    const y = r() < 0.5 ? 0.02 : GLASS_HEIGHT - 0.02;
    return onCylinder(r, [GLASS[0], GLASS[1] + y - 0.02, GLASS[2]], 0.2, 0.04);
  }
  if (pick < 0.8) {
    const t = r();
    const radius = 0.025 + 0.14 * Math.abs(Math.cos(Math.PI * t)) ** 0.5;
    return onCylinder(
      r,
      [GLASS[0], GLASS[1] + 0.04 + t * (GLASS_HEIGHT - 0.08), GLASS[2]],
      radius,
      0
    );
  }
  const [x, , z] = onDisc(r, [GLASS[0], 0, GLASS[2]], 0.12);
  const peak = 0.1 * (1 - Math.hypot(x - GLASS[0], z - GLASS[2]) / 0.12);
  return [x, GLASS[1] + 0.05 + peak * r(), z];
};

const scalesOrder = rise(0.36, 0.56, GROUND, 2.45);

export const LEGAL: IndustryLandmark = {
  parts: [
    ...porticoParts(COURT),
    { weight: 0.75, sample: scalesStand, order: scalesOrder },
    { weight: 0.3, sample: beam, order: () => 0.5 },
    { weight: 0.45, tag: 3, sample: pan(-1), order: () => 0.55 },
    { weight: 0.45, tag: 6, sample: pan(1), order: () => 0.56 },
    { weight: 0.4, tag: 2, sample: files, order: rise(0.4, 0.5, GROUND, 0.4) },
    { weight: 0.4, tag: 5, sample: hourglass, order: rise(0.44, 0.58, GROUND, GLASS_HEIGHT) },
  ],
  draw: (lines) => {
    drawPortico(lines, COURT);
    lines.segment([-ARM, BEAM_Y, SCALES_Z], [ARM, BEAM_Y, SCALES_Z], 0.5);
  },
  icons: ["chat", "document", "search", "calendar", "clock", "shield"],
  anchors: [
    [-0.5, LEVELS.roof + 0.06, LEVELS.front],
    [FILES[0], GROUND + 6 * FOLDER, FILES[2]],
    [-ARM, PAN_Y, SCALES_Z + 0.1],
    [0.5, LEVELS.roof + 0.08, LEVELS.front],
    [GLASS[0] + 0.1, GLASS[1] + GLASS_HEIGHT * 0.5, GLASS[2]],
    [ARM, PAN_Y, SCALES_Z + 0.1],
  ],
};
