import { ICONS } from "./icons";
import {
  drawBlock,
  GROUND,
  onDrawing,
  onFacade,
  onPolyline,
  rise,
  type Block,
  type IndustryLandmark,
} from "./kit";
import { drawPortico, porticoLevels, porticoParts, type Portico } from "./portico";
import {
  between,
  onCylinder,
  onSegment,
  pickIndex,
  tiltX,
  type Random,
  type Vec3,
} from "../sampling";

/**
 * Education: a school. A columned entrance under a pediment stands between two classroom
 * wings, the left one with a bell cupola; an open book lies in front and a graduation cap
 * floats above the roof. Use cases: admissions enquiries land on the cap, fee reminders on
 * the right wing's office floor, attendance alerts on the bell, the AI tutor on the book's
 * right page, grading on its left page and progress analytics on the right wing's classrooms.
 */
const ENTRANCE: Portico = {
  x: 0,
  z: -0.45,
  width: 1.2,
  columns: 4,
  height: 1.2,
  gable: 0.38,
  from: 0.1,
  to: 0.42,
  weight: 1.4,
};
const LEVELS = porticoLevels(ENTRANCE);
const LEFT_WING: Block = [-1.12, -0.6, 0.9, 0.55, 0.95];
const RIGHT_WING: Block = [1.12, -0.6, 0.9, 0.55, 0.95];
const WING_FRONT = LEFT_WING[1] + LEFT_WING[3] / 2;
const WING_ROOF = GROUND + LEFT_WING[4];

/** A cupola on the left wing: four posts, a pyramid roof and the bell inside. */
const BELFRY: Vec3 = [LEFT_WING[0], WING_ROOF, LEFT_WING[1]];
const BELFRY_HALF = 0.14;
const BELFRY_POST = 0.24;
const belfry = (r: Random): Vec3 => {
  const corner = pickIndex(r, 4);
  const cx = BELFRY[0] + (corner % 2 === 0 ? -BELFRY_HALF : BELFRY_HALF);
  const cz = BELFRY[2] + (corner < 2 ? -BELFRY_HALF : BELFRY_HALF);
  const pick = r();
  if (pick < 0.3) {
    return onSegment(r, [cx, BELFRY[1], cz], [cx, BELFRY[1] + BELFRY_POST, cz]);
  }
  if (pick < 0.6) {
    const apex: Vec3 = [BELFRY[0], BELFRY[1] + BELFRY_POST + 0.2, BELFRY[2]];
    return onSegment(r, [cx, BELFRY[1] + BELFRY_POST, cz], apex);
  }
  return onDrawing(r, ICONS.bell, [BELFRY[0], BELFRY[1] + 0.12, BELFRY[2] + 0.1], 0.1);
};

/** An open book on a low stand, tilted to face the viewer, with lines of text on each page. */
const BOOK: Vec3 = [0, GROUND + 0.04, 0.82];
const PAGE_WIDTH = 0.6;
const PAGE_DEPTH = 0.3;
const toBook = (x: number, h: number, depth: number): Vec3 => [
  BOOK[0] + x,
  BOOK[1] + h + (PAGE_DEPTH - depth) * 0.8,
  BOOK[2] + depth * 0.6,
];
const pageHeight = (u: number): number => 0.12 * Math.sqrt(u) * (1 - 0.55 * u);
const page =
  (side: number) =>
  (r: Random): Vec3 => {
    const u = r() < 0.45 ? between(r, 0.12, 0.9) : r();
    const lined = r() < 0.45;
    const depth = lined ? -0.2 + pickIndex(r, 5) * 0.1 : between(r, -PAGE_DEPTH, PAGE_DEPTH);
    return toBook(side * u * PAGE_WIDTH, pageHeight(u) + 0.004, depth);
  };
/** A page's outline: spine, far edge, outer edge and near edge. */
const pageOutline = (side: number): Vec3[] => {
  const curve = (depth: number) =>
    Array.from({ length: 9 }, (_, i) =>
      toBook((side * i * PAGE_WIDTH) / 8, pageHeight(i / 8), depth)
    );
  return [...curve(-PAGE_DEPTH), ...curve(PAGE_DEPTH).reverse(), toBook(0, 0, -PAGE_DEPTH)];
};

/** A mortarboard: a flat square board on a skull cap, a tassel hanging off one corner. */
const CAP: Vec3 = [0, LEVELS.apex + 0.5, -0.3];
const CAP_TILT = 0.35;
const toCap = (point: Vec3): Vec3 => {
  const [x, y, z] = tiltX(point, CAP_TILT);
  return [CAP[0] + x, CAP[1] + y, CAP[2] + z];
};
const BOARD: readonly Vec3[] = [
  [-0.5, 0, 0],
  [0, 0, 0.5],
  [0.5, 0, 0],
  [0, 0, -0.5],
  [-0.5, 0, 0],
];
const TASSEL: readonly Vec3[] = [
  [0, 0.01, 0],
  [0.42, 0.01, 0.06],
  [0.44, -0.3, 0.06],
];
const cap = (r: Random): Vec3 => {
  const pick = r();
  if (pick < 0.3) {
    return toCap(onPolyline(r, BOARD, 0.006));
  }
  if (pick < 0.55) {
    const [a, b] = [between(r, -0.5, 0.5), between(r, -0.5, 0.5)];
    return toCap([(a - b) / 2, 0, (a + b) / 2]);
  }
  if (pick < 0.85) {
    return toCap(onCylinder(r, [0, -0.17, 0], 0.22, 0.17));
  }
  return toCap(onPolyline(r, TASSEL, 0.008));
};

export const EDUCATION: IndustryLandmark = {
  parts: [
    ...porticoParts(ENTRANCE),
    { weight: 1, sample: (r) => onFacade(r, LEFT_WING, 0.16, 0.15), order: rise(0.12, 0.34) },
    { weight: 1, sample: (r) => onFacade(r, RIGHT_WING, 0.16, 0.15), order: rise(0.14, 0.36) },
    { weight: 0.3, tag: 3, sample: belfry, order: () => 0.44 },
    { weight: 0.3, tag: 5, sample: page(-1), order: () => 0.48 },
    { weight: 0.3, tag: 4, sample: page(1), order: () => 0.5 },
    { weight: 0.55, tag: 1, sample: cap, order: () => 0.6 },
  ],
  draw: (lines) => {
    drawPortico(lines, ENTRANCE);
    drawBlock(lines, LEFT_WING, 0.12, 0.34);
    drawBlock(lines, RIGHT_WING, 0.14, 0.36);
    lines.path(pageOutline(-1), 0.46, 0.48);
    lines.path(pageOutline(1), 0.48, 0.5);
  },
  icons: ["chat", "coin", "bell", "person", "check", "chart"],
  anchors: [
    toCap([-0.5, 0, 0]),
    [RIGHT_WING[0], GROUND + 0.75, WING_FRONT],
    [BELFRY[0], BELFRY[1] + 0.12, BELFRY[2] + 0.1],
    toBook(0.3, 0.08, 0),
    toBook(-0.3, 0.08, 0),
    [RIGHT_WING[0] + 0.25, GROUND + 0.3, WING_FRONT],
  ],
};
