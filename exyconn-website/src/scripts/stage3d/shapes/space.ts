import {
  fillCloud,
  jitter,
  onArc,
  onBox,
  onRing,
  onSphere,
  offset,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Space: a banded planet with two rings, satellites on dotted orbits and a moon.
 *
 * Points are sampled untilted, around the Y axis; the shader spins each about Y at the rate
 * in its tag (radians per second, 0 = still) and then applies the system's tilt.
 */
export const PLANET_RADIUS = 1.3;
export const PLANET_TILT: Readonly<{ x: number; z: number }> = { x: 0.42, z: -0.22 };
export const SPIN = { planet: 0.06, rings: 0.1, satellites: 0.32, moon: 0.18 } as const;
const ORBITS = [3.05, 3.45] as const;

/** Latitude bands: rejection-sample the sphere so stripes come out denser. */
const bandedSurface = (random: Random): Vec3 => {
  let point = onSphere(random, PLANET_RADIUS);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const latitude = Math.asin(point[1] / PLANET_RADIUS);
    if (random() < 0.35 + 0.65 * Math.sin(latitude * 7) ** 2) {
      return point;
    }
    point = onSphere(random, PLANET_RADIUS);
  }
  return point;
};

const ring = (random: Random): Vec3 => {
  const point = random() < 0.62 ? onRing(random, 1.75, 2.15) : onRing(random, 2.27, 2.6);
  return jitter(random, point, 0.012);
};

/** One satellite: a body with a solar panel either side, at `centre`. */
export const satellite = (random: Random, centre: Vec3 = [0, 0, 0]): Vec3 => {
  const piece = random();
  if (piece < 0.35) {
    return onBox(random, centre, [0.2, 0.2, 0.26]);
  }
  const sign = piece < 0.675 ? -1 : 1;
  return onBox(random, offset(centre, [sign * 0.34, 0, 0]), [0.42, 0.02, 0.18]);
};

const orbitingSatellite = (random: Random): Vec3 => {
  const index = Math.floor(random() * 3);
  const radius = ORBITS[index % 2];
  const angle = index * 2.1;
  return satellite(random, [radius * Math.cos(angle), 0, radius * Math.sin(angle)]);
};

const orbitPath = (random: Random): Vec3 =>
  onArc(random, ORBITS[random() < 0.5 ? 0 : 1], 0, Math.PI * 2);

export const sampleSpace = (count: number, random: Random): Cloud =>
  fillCloud(
    count,
    [
      { weight: 0.4, tag: SPIN.planet, sample: bandedSurface },
      { weight: 0.06, tag: SPIN.planet, sample: (r) => onSphere(r, PLANET_RADIUS * 1.1) },
      { weight: 0.27, tag: SPIN.rings, sample: ring },
      { weight: 0.11, tag: SPIN.satellites, sample: orbitingSatellite },
      { weight: 0.12, sample: orbitPath },
      { weight: 0.04, tag: SPIN.moon, sample: (r) => onSphere(r, 0.22, [3.9, 0.3, -0.6]) },
    ],
    random
  );

const SATELLITE_PARTS: readonly Part[] = [{ weight: 1, sample: (r) => satellite(r) }];

export const sampleSatellite = (count: number, random: Random): Cloud =>
  fillCloud(count, SATELLITE_PARTS, random);
