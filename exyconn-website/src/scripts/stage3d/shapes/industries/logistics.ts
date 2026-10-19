import { ICONS } from "./icons";
import {
  drawBlock,
  GROUND,
  onDrawing,
  onFacade,
  rise,
  sweep,
  type Block,
  type IndustryLandmark,
} from "./kit";
import { box, circle } from "../../../../lib/detail/glyphs";
import { between, onBox, pickIndex, type Random, type Vec3 } from "../sampling";

/**
 * Logistics: a distribution warehouse. A long gabled shed with three roller doors stands at
 * the back, a truck (trailer and cab on six wheels) waits beside it, a stack of parcels sits
 * at the dock and a road with lane marks runs along the front; a map pin hovers over the roof.
 * Use cases: shipment tracking lands on the pin, route planning on the road, proof of delivery
 * at the dock doors, exception alerts on the cab, warehouse stock on the parcels and freight
 * reports on the trailer.
 */
const SHED: Block = [-0.5, -0.45, 2.3, 0.9, 1.05];
const SHED_FRONT = SHED[1] + SHED[3] / 2;
const EAVES = GROUND + SHED[4];
const RIDGE = EAVES + 0.32;
const DOORS = [-1.3, -0.85, -0.4];
const DOOR_W = 0.36;
const DOOR_H = 0.62;
const TRUCK_Z = 0.42;
const TRUCK_D = 0.36;
const FLOOR = GROUND + 0.2;
const TRAILER: [Vec3, Vec3] = [
  [0.55, FLOOR + 0.32, TRUCK_Z],
  [1.15, 0.64, TRUCK_D],
];
const CAB: [Vec3, Vec3] = [
  [1.35, FLOOR + 0.22, TRUCK_Z],
  [0.28, 0.44, TRUCK_D],
];
const HOOD: [Vec3, Vec3] = [
  [1.57, FLOOR + 0.1, TRUCK_Z],
  [0.16, 0.2, TRUCK_D * 0.9],
];
const WHEELS = [0.12, 0.34, 1, 1.48];
const ROAD = [0.82, 1.12];
const PIN: Vec3 = [-1.05, RIDGE + 0.42, SHED[1]];
const PARCELS: readonly Vec3[] = [
  [-1.45, GROUND + 0.1, 0.45],
  [-1.22, GROUND + 0.1, 0.45],
  [-0.99, GROUND + 0.1, 0.45],
  [-1.34, GROUND + 0.3, 0.45],
  [-1.11, GROUND + 0.3, 0.45],
  [-1.22, GROUND + 0.5, 0.45],
];

/** The two roof slopes, ridge running along x. */
const roof = (r: Random): Vec3 => {
  const t = between(r, -1, 1);
  return [
    between(r, SHED[0] - SHED[2] / 2, SHED[0] + SHED[2] / 2),
    RIDGE - (RIDGE - EAVES) * Math.abs(t),
    SHED[1] + (t * SHED[3]) / 2,
  ];
};

/** Roller doors: a frame and horizontal slats on the front wall. */
const door = (r: Random): Vec3 => {
  const x = DOORS[pickIndex(r, DOORS.length)];
  const slat = pickIndex(r, 8);
  return [
    x + between(r, -DOOR_W / 2, DOOR_W / 2),
    GROUND + (slat + 0.5) * (DOOR_H / 8),
    SHED_FRONT + 0.01,
  ];
};

const wheel = (r: Random): Vec3 => {
  const x = WHEELS[pickIndex(r, WHEELS.length)];
  const z = TRUCK_Z + (r() < 0.5 ? -TRUCK_D / 2 : TRUCK_D / 2);
  return onDrawing(r, [circle(0, 0, 1, 14), circle(0, 0, 0.45, 8)], [x, GROUND + 0.1, z], 0.1);
};

/** Windscreen and side window on the cab. */
const windows = (r: Random): Vec3 => {
  const front = CAB[0][0] + CAB[1][0] / 2 + 0.005;
  if (r() < 0.5) {
    return [front, between(r, FLOOR + 0.24, FLOOR + 0.38), TRUCK_Z + between(r, -0.15, 0.15)];
  }
  return onDrawing(
    r,
    [box(-1, -1, 1, 1)],
    [1.34, FLOOR + 0.31, TRUCK_Z + TRUCK_D / 2 + 0.005],
    0.08
  );
};

const PARCEL: Vec3 = [0.2, 0.18, 0.2];
const parcel = (at: Vec3) => (r: Random) => onBox(r, at, PARCEL);

/** Dashed centre line between the two road edges. */
const lane = (r: Random): Vec3 => {
  const dash = pickIndex(r, 8);
  const x = -1.55 + dash * 0.42 + between(r, 0, 0.2);
  return [x, GROUND + 0.005, (ROAD[0] + ROAD[1]) / 2];
};

export const LOGISTICS: IndustryLandmark = {
  parts: [
    { weight: 1.6, sample: (r) => onFacade(r, SHED, 0.2, 0.2), order: rise(0.08, 0.26) },
    { weight: 1, sample: roof, order: sweep(0.24, 0.32) },
    { weight: 0.9, sample: door, order: rise(0.14, 0.22) },
    { weight: 1.1, sample: (r) => onBox(r, ...TRAILER), order: sweep(0.32, 0.42) },
    { weight: 0.45, sample: (r) => onBox(r, ...CAB), order: () => 0.44 },
    { weight: 0.15, sample: (r) => onBox(r, ...HOOD), order: () => 0.45 },
    { weight: 0.18, sample: windows, order: () => 0.46 },
    { weight: 0.6, sample: wheel, order: sweep(0.3, 0.4) },
    ...PARCELS.map((at, i) => ({
      weight: 0.07,
      tag: 5,
      sample: parcel(at),
      order: () => 0.48 + i * 0.012,
    })),
    { weight: 0.25, sample: lane, order: sweep(0.1, 0.2) },
    { weight: 0.22, tag: 1, sample: (r) => onDrawing(r, ICONS.pin, PIN, 0.22), order: () => 0.6 },
  ],
  draw: (lines) => {
    drawBlock(lines, SHED, 0.08, 0.26);
    const [x, z, w, d] = SHED;
    const ends = [x - w / 2, x + w / 2];
    ends.forEach((ex) => {
      lines.path(
        [
          [ex, EAVES, z - d / 2],
          [ex, RIDGE, z],
          [ex, EAVES, z + d / 2],
        ],
        0.26,
        0.3
      );
    });
    lines.segment([ends[0], RIDGE, z], [ends[1], RIDGE, z], 0.32);
    DOORS.forEach((dx) => {
      lines.path(
        [
          [dx - DOOR_W / 2, GROUND, SHED_FRONT + 0.01],
          [dx - DOOR_W / 2, GROUND + DOOR_H, SHED_FRONT + 0.01],
          [dx + DOOR_W / 2, GROUND + DOOR_H, SHED_FRONT + 0.01],
          [dx + DOOR_W / 2, GROUND, SHED_FRONT + 0.01],
        ],
        0.14,
        0.22
      );
    });
    lines.box(...TRAILER, 0.32, 0.42);
    lines.box(...CAB, 0.42, 0.46);
    lines.box(...HOOD, 0.44, 0.46);
    PARCELS.forEach((at, i) => lines.box(at, PARCEL, 0.48 + i * 0.012, 0.5 + i * 0.012));
    ROAD.forEach((rz) => lines.segment([-1.6, GROUND, rz], [1.6, GROUND, rz], 0.1));
  },
  icons: ["pin", "route", "document", "bell", "parcel", "chart"],
  anchors: [
    [PIN[0], PIN[1] - 0.2, PIN[2]],
    [0.6, GROUND, (ROAD[0] + ROAD[1]) / 2],
    [DOORS[2], GROUND + DOOR_H, SHED_FRONT],
    [CAB[0][0], FLOOR + 0.4, TRUCK_Z],
    [PARCELS[5][0], PARCELS[5][1] + 0.09, PARCELS[5][2]],
    [0.75, TRAILER[0][1] + 0.1, TRUCK_Z + TRUCK_D / 2],
  ],
};
