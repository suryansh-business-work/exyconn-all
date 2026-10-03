import {
  between,
  fillCloud,
  jitter,
  onArc,
  onSegment,
  onTriangle,
  tiltX,
  tiltZ,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Aviation: a swept-wing jet, nose along +X, trailing contrails, flying inside dotted
 * flight-path arcs above a radar plate. Contrail points are tagged so the shader can stream
 * them backwards: 1 streams from the engines, 2 from the wingtips.
 */
export const TRAIL_END = -5.4;
export const ENGINE_TRAIL = 1;
export const WINGTIP_TRAIL = 2;
export const ENGINE_X = -0.15;
export const WINGTIP_X = -1.35;

const side = (random: Random): number => (random() < 0.5 ? -1 : 1);
const mirror = ([x, y, z]: Vec3, sign: number): Vec3 => [x, y, z * sign];

const quad = (random: Random, a: Vec3, b: Vec3, c: Vec3, d: Vec3): Vec3 =>
  random() < 0.5 ? onTriangle(random, a, b, c) : onTriangle(random, a, c, d);

const fuselage = (random: Random): Vec3 => {
  const u = random();
  const radius = 0.3 * Math.sin(Math.PI * u) ** 0.55;
  const angle = random() * Math.PI * 2;
  return [-2 + 4.1 * u, radius * Math.cos(angle), radius * Math.sin(angle)];
};

const wing = (random: Random): Vec3 =>
  mirror(
    quad(
      random,
      [0.5, -0.05, 0.25],
      [-0.55, -0.05, 0.25],
      [WINGTIP_X, -0.05, 2],
      [-0.95, -0.05, 2]
    ),
    side(random)
  );

const tailplane = (random: Random): Vec3 =>
  mirror(
    quad(random, [-1.55, 0.05, 0.15], [-2, 0.05, 0.15], [-2.1, 0.05, 0.85], [-1.85, 0.05, 0.85]),
    side(random)
  );

const fin = (random: Random): Vec3 =>
  quad(random, [-1.35, 0.2, 0], [-2, 0.2, 0], [-2.1, 1, 0], [-1.8, 1, 0]);

const engine = (random: Random): Vec3 => {
  const angle = random() * Math.PI * 2;
  return [
    between(random, ENGINE_X, 0.55),
    -0.28 + 0.13 * Math.cos(angle),
    side(random) * 0.85 + 0.13 * Math.sin(angle),
  ];
};

const trail = (random: Random, x: number, y: number, z: number): Vec3 =>
  jitter(random, onSegment(random, [x, y, z], [TRAIL_END, y, z]), 0.025);

const flightArc = (random: Random): Vec3 => {
  const lane = Math.floor(random() * 3);
  const point = onArc(random, 3 + lane * 0.35, -2.4 + lane * 0.5, 0.6 + lane * 0.5);
  return tiltZ(tiltX(point, 0.5 - lane * 0.35), 0.18 * lane - 0.2);
};

const radar = (random: Random): Vec3 => {
  const ring = 1.2 + Math.floor(random() * 3) * 0.8;
  const [x, , z] = onArc(random, ring, 0, Math.PI * 2);
  return [x, -1.45, z];
};

/** Body only — the small planes crossing the background reuse it. */
export const JET_BODY: readonly Part[] = [
  { weight: 0.24, sample: fuselage },
  { weight: 0.24, sample: wing },
  { weight: 0.05, sample: tailplane },
  { weight: 0.05, sample: fin },
  { weight: 0.06, sample: engine },
];

export const sampleJet = (count: number, random: Random): Cloud =>
  fillCloud(
    count,
    [
      ...JET_BODY,
      { weight: 0.08, tag: ENGINE_TRAIL, sample: (r) => trail(r, ENGINE_X, -0.28, side(r) * 0.85) },
      { weight: 0.06, tag: WINGTIP_TRAIL, sample: (r) => trail(r, WINGTIP_X, -0.05, side(r) * 2) },
      { weight: 0.14, sample: flightArc },
      { weight: 0.08, sample: radar },
    ],
    random
  );

export const sampleJetSilhouette = (count: number, random: Random): Cloud =>
  fillCloud(count, JET_BODY, random);
