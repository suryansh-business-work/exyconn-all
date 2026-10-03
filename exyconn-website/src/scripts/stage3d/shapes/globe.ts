import {
  fillCloud,
  jitter,
  onSphere,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * A dotted globe with great-circle arcs between places (offices, markets). Arc `i` and its
 * two end markers carry tag `i + 1`, so a card can light one route; the surface is tag 0.
 */
export interface LatLon {
  /** Degrees, -90 (south) to 90 (north). */
  lat: number;
  /** Degrees, -180 (west) to 180 (east). */
  lon: number;
}

export interface GlobeArc {
  from: LatLon;
  to: LatLon;
}

export interface GlobeParams {
  arcs?: readonly GlobeArc[];
  /** At most this many arcs are drawn (24 keeps a phone readable). */
  maxArcs?: number;
}

export const GLOBE_RADIUS = 1.5;
export const GLOBE_BOUNDS: Vec3 = [2.1, 2.1, 2.1];
const DEFAULT_MAX_ARCS = 24;
const DEG = Math.PI / 180;

export const fromLatLon = ({ lat, lon }: LatLon, radius: number): Vec3 => [
  radius * Math.cos(lat * DEG) * Math.sin(lon * DEG),
  radius * Math.sin(lat * DEG),
  radius * Math.cos(lat * DEG) * Math.cos(lon * DEG),
];

/** Along the great circle a→b at `t`, lifted off the surface by up to `lift` mid-way. */
export const arcPoint = (a: Vec3, b: Vec3, t: number, lift: number): Vec3 => {
  const dot = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (GLOBE_RADIUS * GLOBE_RADIUS);
  const omega = Math.acos(Math.min(1, Math.max(-1, dot)));
  const height = 1 + (lift / GLOBE_RADIUS) * Math.sin(Math.PI * t);
  if (omega < 1e-4) {
    return [a[0] * height, a[1] * height, a[2] * height];
  }
  const wa = Math.sin((1 - t) * omega) / Math.sin(omega);
  const wb = Math.sin(t * omega) / Math.sin(omega);
  return [
    (a[0] * wa + b[0] * wb) * height,
    (a[1] * wa + b[1] * wb) * height,
    (a[2] * wa + b[2] * wb) * height,
  ];
};

const arcParts = (arc: GlobeArc, tag: number, share: number): Part[] => {
  const a = fromLatLon(arc.from, GLOBE_RADIUS);
  const b = fromLatLon(arc.to, GLOBE_RADIUS);
  const angle = Math.acos(
    Math.min(1, Math.max(-1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / GLOBE_RADIUS ** 2))
  );
  const lift = 0.1 + 0.35 * (angle / Math.PI);
  return [
    { weight: share * 0.8, tag, sample: (r) => arcPoint(a, b, r(), lift) },
    {
      weight: share * 0.2,
      tag,
      sample: (r) => onSphere(r, 0.05, r() < 0.5 ? a : b),
    },
  ];
};

export const sampleGlobe = (count: number, random: Random, params: GlobeParams = {}): Cloud => {
  const arcs = (params.arcs ?? []).slice(0, params.maxArcs ?? DEFAULT_MAX_ARCS);
  const share = arcs.length > 0 ? 0.4 / arcs.length : 0;
  return fillCloud(
    count,
    [
      { weight: 0.6, sample: (r) => jitter(r, onSphere(r, GLOBE_RADIUS), 0.01) },
      ...arcs.flatMap((arc, index) => arcParts(arc, index + 1, share)),
    ],
    random
  );
};
