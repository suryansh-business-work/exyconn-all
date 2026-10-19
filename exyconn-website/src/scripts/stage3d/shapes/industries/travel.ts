import { ICONS } from "./icons";
import {
  GROUND,
  onDisc,
  onDrawing,
  onPolyline,
  ringPoints,
  rise,
  sweep,
  type IndustryLandmark,
} from "./kit";
import { arcPoints } from "../lines";
import { between, jitter, onBox, pickIndex, tiltZ, type Random, type Vec3 } from "../sampling";

/**
 * Travel: the world. A dotted globe with its latitude and meridian rings turns on a stand;
 * a map pin marks a destination on it, a plane climbs away over the top trailing a dashed
 * flight path, a departures board stands by and a suitcase waits with its handle up. Use
 * cases: itineraries land on the plane, bookings on the destination pin, traveller support
 * on the globe, visas and documents on the suitcase, disruption alerts on the departures
 * board and supplier reports on the stand.
 */
const GLOBE: Vec3 = [-0.1, -0.22, -0.2];
const RADIUS = 0.78;
const AXIS_TILT = -0.4;
const STAND_TOP = GLOBE[1] - RADIUS - 0.05;
const PLANE: Vec3 = [-1.05, 1, 0.15];
const PIN_DIR: Vec3 = [0.55, 0.5, 0.67];
const PIN_TIP = GLOBE.map((c, i) => c + RADIUS * PIN_DIR[i]) as Vec3;
const SUITCASE: Vec3 = [1.15, GROUND, 0.55];
const BOARD: Vec3 = [-1.25, GROUND, 0.5];
const TRAIL = arcPoints(
  [PIN_TIP[0], PIN_TIP[1] + 0.35, PIN_TIP[2]],
  [PLANE[0] + 0.3, PLANE[1] - 0.05, PLANE[2]],
  0.35,
  24
);

const onGlobe = (point: Vec3): Vec3 => {
  const [x, y, z] = tiltZ(point, AXIS_TILT);
  return [GLOBE[0] + x, GLOBE[1] + y, GLOBE[2] + z];
};

/** A point at latitude `lat` and longitude `lon` on the tilted globe. */
const atLatLon = (lat: number, lon: number, r = RADIUS): Vec3 =>
  onGlobe([
    r * Math.cos(lat) * Math.cos(lon),
    r * Math.sin(lat),
    r * Math.cos(lat) * Math.sin(lon),
  ]);

/** Latitude rings, meridians and a scatter of land on a tilted sphere. */
const globe = (r: Random): Vec3 => {
  const pick = r();
  const angle = r() * Math.PI * 2;
  if (pick < 0.4) {
    return atLatLon(((pickIndex(r, 5) - 2) * Math.PI) / 6, angle);
  }
  if (pick < 0.8) {
    return atLatLon(angle, (pickIndex(r, 6) * Math.PI) / 6);
  }
  const lat = between(r, -0.9, 1.1);
  const lon = between(r, -0.5, 1.4) + (r() < 0.5 ? 0 : Math.PI * 0.9);
  return jitter(r, atLatLon(lat, lon), 0.01);
};

/** The stand: a base, a neck, and the half-ring that holds the axis. */
const stand = (r: Random): Vec3 => {
  const pick = r();
  if (pick < 0.35) {
    return onDisc(r, [GLOBE[0], GROUND + 0.02, GLOBE[2]], 0.38);
  }
  if (pick < 0.55) {
    return [GLOBE[0], between(r, GROUND, STAND_TOP), GLOBE[2]];
  }
  return atLatLon(between(r, -Math.PI / 2, Math.PI / 2), Math.PI, RADIUS + 0.08);
};

/** A jet seen from above, nose to the left, climbing. */
const HALF = [
  -1, 0, -0.82, 0.09, -0.2, 0.1, 0.25, 0.8, 0.42, 0.8, 0.3, 0.1, 0.72, 0.1, 0.88, 0.4, 1, 0.4, 0.95,
  0,
];
const CLIMB = -0.35;
const PLANE_PATH = Array.from({ length: HALF.length - 1 }, (_, i) => {
  const k = i < HALF.length / 2 ? i : HALF.length - 2 - i;
  const [x, y] = [HALF[k * 2], HALF[k * 2 + 1] * (i < HALF.length / 2 ? 1 : -1)];
  return [
    x * Math.cos(CLIMB) - y * Math.sin(CLIMB),
    x * Math.sin(CLIMB) + y * Math.cos(CLIMB),
  ] as const;
});

const plane = (r: Random): Vec3 => {
  const point = onDrawing(r, [PLANE_PATH], PLANE, 0.3);
  return [point[0], point[1], point[2] + between(r, -0.02, 0.02)];
};

/** Every other dash of the flight path. */
const trail = (r: Random): Vec3 => {
  const k = pickIndex(r, TRAIL.length / 2) * 2;
  return onPolyline(r, [TRAIL[k], TRAIL[Math.min(k + 1, TRAIL.length - 1)]], 0.005);
};

const pin = (r: Random): Vec3 => {
  const point = onDrawing(r, ICONS.pin, [PIN_TIP[0], PIN_TIP[1] + 0.22, PIN_TIP[2]], 0.26);
  return [point[0], point[1], point[2] + between(r, -0.03, 0.03)];
};

/** A suitcase on wheels: shell, two straps, telescopic handle. */
const suitcase = (r: Random): Vec3 => {
  const [x, , z] = SUITCASE;
  const pick = r();
  if (pick < 0.62) {
    return onBox(r, [x, GROUND + 0.3, z], [0.5, 0.44, 0.2]);
  }
  if (pick < 0.8) {
    const strap = x + (r() < 0.5 ? -0.12 : 0.12);
    return jitter(r, [strap, between(r, GROUND + 0.08, GROUND + 0.52), z + 0.1], 0.006);
  }
  const handle: Vec3[] = [
    [x - 0.1, GROUND + 0.52, z - 0.05],
    [x - 0.1, GROUND + 0.8, z - 0.05],
    [x + 0.1, GROUND + 0.8, z - 0.05],
    [x + 0.1, GROUND + 0.52, z - 0.05],
  ];
  return onPolyline(r, handle, 0.005);
};

/** A departures board on two legs, its rows of flights as dashes. */
const board = (r: Random): Vec3 => {
  const [x, , z] = BOARD;
  const pick = r();
  if (pick < 0.2) {
    const leg = x + (r() < 0.5 ? -0.2 : 0.2);
    return [leg, between(r, GROUND, GROUND + 0.45), z];
  }
  if (pick < 0.5) {
    const frame: Vec3[] = [
      [x - 0.28, GROUND + 0.45, z],
      [x - 0.28, GROUND + 0.85, z],
      [x + 0.28, GROUND + 0.85, z],
      [x + 0.28, GROUND + 0.45, z],
      [x - 0.28, GROUND + 0.45, z],
    ];
    return onPolyline(r, frame, 0.005);
  }
  const row = GROUND + 0.52 + pickIndex(r, 4) * 0.08;
  const cell = pickIndex(r, 3);
  return [x - 0.22 + cell * 0.16 + r() * 0.12, row, z + 0.01];
};

export const TRAVEL: IndustryLandmark = {
  parts: [
    { weight: 0.5, sample: stand, order: rise(0.08, 0.16, GROUND, 0.4) },
    { weight: 3.2, sample: globe, order: rise(0.14, 0.42, GLOBE[1] - RADIUS, RADIUS * 2) },
    { weight: 0.35, tag: 2, sample: pin, order: () => 0.46 },
    { weight: 0.4, tag: 1, sample: trail, order: sweep(0.6, 0.5, -1, 1.6) },
    { weight: 0.4, tag: 1, sample: plane, order: () => 0.6 },
    { weight: 0.4, tag: 5, sample: board, order: rise(0.44, 0.54, GROUND, 0.9) },
    { weight: 0.55, tag: 4, sample: suitcase, order: rise(0.3, 0.4, GROUND, 0.8) },
  ],
  draw: (lines) => {
    lines.path(ringPoints([GLOBE[0], GROUND + 0.02, GLOBE[2]], 0.38, 0.38, 24), 0.08, 0.12);
    lines.segment([GLOBE[0], GROUND, GLOBE[2]], [GLOBE[0], STAND_TOP, GLOBE[2]], 0.12);
    lines.box([SUITCASE[0], GROUND + 0.3, SUITCASE[2]], [0.5, 0.44, 0.2], 0.3, 0.36);
  },
  icons: ["route", "ticket", "chat", "document", "bell", "chart"],
  anchors: [
    [PLANE[0] + 0.1, PLANE[1], PLANE[2]],
    [PIN_TIP[0], PIN_TIP[1] + 0.22, PIN_TIP[2]],
    onGlobe([-RADIUS, 0, 0.1]),
    [SUITCASE[0], GROUND + 0.4, SUITCASE[2] + 0.1],
    [BOARD[0], GROUND + 0.65, BOARD[2]],
    [GLOBE[0] + 0.3, GROUND + 0.03, GLOBE[2] + 0.2],
  ],
};
