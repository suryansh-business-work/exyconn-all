import { clamp } from "../../math";
import type { GlyphPath } from "../glyph";
import { arcPoints, createLines, type LineBuilder } from "../lines";
import {
  between,
  fillCloud,
  jitter,
  onArc,
  onSphere,
  pickIndex,
  tiltX,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "../sampling";
import { ICONS, type IconName } from "./icons";

/**
 * Every industry scene tells the same story: the business at the centre — a hotel, a clinic,
 * a warehouse — and round it the six things AI runs there, each a marker wired to the part of
 * the business it works on. The landmark rises from a round plinth first, then the markers
 * appear one by one, and last their links light up and carry packets in.
 *
 * Use case `i` (the page's card `i`, its scroll-story step) is tag `i + 1`: its marker, its
 * link and any landmark part the industry tags with it all light together.
 */
export const INDUSTRY_BOUNDS: Vec3 = [2.7, 1.75, 1.45];
export const INDUSTRY_PITCH = 0.2;
export const GROUND = -1.35;
/** The landmark builds between these orders; the plinth before, the markers after. */
export const LANDMARK_FROM = 0.08;
export const LANDMARK_TO = 0.62;
export const USE_CASES = 6;

type Six<T> = readonly [T, T, T, T, T, T];

export interface IndustryLandmark {
  /** The landmark as point parts; tag 0 unless a part belongs to one use case. */
  parts: readonly Part[];
  /** Its structure: building edges, frames, a road. Built between the landmark orders. */
  draw?: (lines: LineBuilder) => void;
  /** Use case `i`'s marker drawing. */
  icons: Six<IconName>;
  /** Where use case `i`'s link lands on the landmark. */
  anchors: Six<Vec3>;
}

/** Where the markers float: three each side, read left then right, top to bottom. */
export const MARKERS: Six<Vec3> = [
  [-2.2, 0.95, 0.2],
  [2.2, 0.95, 0.2],
  [-2.35, 0.05, 0.45],
  [2.35, 0.05, 0.45],
  [-2.15, -0.85, 0.7],
  [2.15, -0.85, 0.7],
];
const ICON_SCALE = 0.19;
const HALO = 0.3;
const PLINTH: readonly [number, number] = [1.9, 1.15];
/** Share of the point budget the landmark gets; the plinth, markers and links share the rest. */
const LANDMARK_SHARE = 0.68;

/** Order between `from` and `to` by height above `bottom` — floors built bottom to top. */
export const rise =
  (from: number, to: number, bottom = GROUND, height = 2.6) =>
  (point: Vec3): number =>
    from + (to - from) * clamp((point[1] - bottom) / height);

/** Order between `from` and `to` by x — built left to right. */
export const sweep =
  (from: number, to: number, left = -1.6, width = 3.2) =>
  (point: Vec3): number =>
    from + (to - from) * clamp((point[0] - left) / width);

/** Uniform along a 3D polyline (long legs get more points). */
export const onPolyline = (random: Random, points: readonly Vec3[], noise = 0.01): Vec3 => {
  const lengths = points
    .slice(1)
    .map((point, i) => Math.hypot(...([0, 1, 2] as const).map((k) => point[k] - points[i][k])));
  let target = random() * lengths.reduce((sum, length) => sum + length, 0);
  let index = 0;
  while (index < lengths.length - 1 && target > lengths[index]) {
    target -= lengths[index];
    index += 1;
  }
  const t = lengths[index] > 0 ? target / lengths[index] : 0;
  const a = points[index];
  const b = points[index + 1];
  return jitter(
    random,
    [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
    noise
  );
};

/** 2D line drawings ([-1, 1], y up) stood up facing the camera at `centre`, `scale` per unit. */
export const onDrawing = (
  random: Random,
  paths: readonly GlyphPath[],
  centre: Vec3,
  scale: number
): Vec3 => {
  const path = paths[pickIndex(random, paths.length)];
  const points = path.map(([x, y]): Vec3 => [
    centre[0] + x * scale,
    centre[1] + y * scale,
    centre[2],
  ]);
  return onPolyline(random, points, 0.008);
};

/** A box as a block: [x, z, width, depth, height], standing on the ground. */
export type Block = readonly [number, number, number, number, number];

/** A lit window on a block's front or side facade, on a grid of `floor` × `column`. */
export const onFacade = (random: Random, block: Block, floor = 0.13, column = 0.12): Vec3 => {
  const [x, z, w, d, h] = block;
  const front = random() < 0.72;
  const across = front ? w : d;
  const columns = Math.max(2, Math.floor(across / column));
  const floors = Math.max(2, Math.floor(h / floor));
  const u = ((pickIndex(random, columns) + 0.5) / columns - 0.5) * across;
  const y = GROUND + (pickIndex(random, floors) + 0.5) * (h / floors);
  const side = x + (u > 0 ? w / 2 : -w / 2);
  return jitter(random, front ? [x + u, y, z + d / 2] : [side, y, z + u], 0.01);
};

/** The block's frame, drawn bottom to top between `from` and `to`. */
export const drawBlock = (lines: LineBuilder, block: Block, from: number, to: number): void => {
  const [x, z, w, d, h] = block;
  lines.box([x, GROUND + h / 2, z], [w, h, d], from, to);
};

/** Head and shoulders facing the viewer, `scale` 1 ≈ a person on the plinth. */
export const onPerson = (random: Random, at: Vec3, scale = 1): Vec3 => {
  if (random() < 0.4) {
    return onSphere(random, 0.05 * scale, [at[0], at[1] + 0.09 * scale, at[2]]);
  }
  const [x, y, z] = tiltX(onArc(random, 0.095 * scale, 0, Math.PI), -Math.PI / 2);
  return [at[0] + x, at[1] + y - 0.04 * scale, at[2] + z * 0.4];
};

/** A flat disc of radius `r` lying in the XZ plane at `centre`. */
export const onDisc = (random: Random, centre: Vec3, r: number): Vec3 => {
  const angle = random() * Math.PI * 2;
  const radius = r * Math.sqrt(random());
  return [centre[0] + radius * Math.cos(angle), centre[1], centre[2] + radius * Math.sin(angle)];
};

/** A circle of radius `r` in the XZ plane at `centre`, as a closed polyline. */
export const ringPoints = (centre: Vec3, r: number, rz = r, steps = 32): Vec3[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2;
    return [centre[0] + r * Math.cos(angle), centre[1], centre[2] + rz * Math.sin(angle)];
  });

const plinthPoint = (random: Random): Vec3 => {
  const ring = 0.55 + 0.45 * Math.sqrt(random());
  const angle = random() * Math.PI * 2;
  const snapped = random() < 0.6 ? Math.round(ring * 6) / 6 : ring;
  return [
    PLINTH[0] * snapped * Math.cos(angle),
    GROUND - 0.02,
    PLINTH[1] * snapped * Math.sin(angle),
  ];
};

/** The marker's halo and drawing, facing the camera. */
const markerPoint =
  (index: number, icon: IconName) =>
  (random: Random): Vec3 => {
    const at = MARKERS[index];
    if (random() < 0.3) {
      const angle = random() * Math.PI * 2;
      return jitter(
        random,
        [at[0] + HALO * Math.cos(angle), at[1] + HALO * Math.sin(angle), at[2]],
        0.01
      );
    }
    return onDrawing(random, ICONS[icon], at, ICON_SCALE);
  };

/** Where a marker's link leaves its halo, on the side facing the landmark. */
const linkStart = (index: number): Vec3 => {
  const at = MARKERS[index];
  return [at[0] - Math.sign(at[0]) * HALO, at[1], at[2]];
};

const linkPath = (index: number, anchor: Vec3): Vec3[] =>
  arcPoints(linkStart(index), anchor, 0.25, 18);

const markerOrder = (index: number) => 0.66 + index * 0.035;
const linkOrder = (index: number) => 0.86 + index * 0.015;

/** The sampler for one industry: its landmark on the plinth with six wired use cases. */
export const industryScene =
  (landmark: IndustryLandmark) =>
  (count: number, random: Random): Cloud => {
    const landmarkWeight = landmark.parts.reduce((sum, part) => sum + part.weight, 0) || 1;
    const scale = LANDMARK_SHARE / landmarkWeight;
    const parts: Part[] = [
      { weight: 0.07, sample: plinthPoint, order: (p) => 0.06 * clamp((p[0] + 2) / 4) },
      ...landmark.parts.map((part) => ({ ...part, weight: part.weight * scale })),
      ...landmark.icons.map((icon, index) => ({
        weight: 0.033,
        tag: index + 1,
        sample: markerPoint(index, icon),
        order: () => markerOrder(index),
      })),
      ...landmark.anchors.map((anchor, index) => {
        const path = linkPath(index, anchor);
        return {
          weight: 0.008,
          tag: index + 1,
          sample: (r: Random) => onPolyline(r, path, 0.006),
          order: () => linkOrder(index) + between(random, 0, 0.04),
        };
      }),
    ];
    const cloud = fillCloud(count, parts, random);
    const lines = createLines();
    lines.path(ringPoints([0, GROUND - 0.02, 0], PLINTH[0], PLINTH[1], 48), 0, 0.06);
    landmark.draw?.(lines);
    landmark.anchors.forEach((anchor, index) => {
      lines.path(linkPath(index, anchor), linkOrder(index), linkOrder(index) + 0.06, true);
    });
    return { ...cloud, lines: lines.build() };
  };
