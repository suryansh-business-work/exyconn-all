import {
  between,
  fillCloud,
  jitter,
  onBox,
  onCylinder,
  onRing,
  onSegment,
  onSphere,
  offset,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Robotics: an articulated arm beside a conveyor, picking from a line of packets.
 *
 * The arm moves in the shader, so its points are tagged by the joint they hang from:
 * UPPER_ARM turns about the shoulder, FOREARM about the elbow and then the shoulder. Belt
 * slats and packets are tagged CONVEYOR and stream along +X, wrapping at the belt's ends.
 */
export const STATIC = 0;
export const UPPER_ARM = 1;
export const FOREARM = 2;
export const CONVEYOR = 3;

/** The arm works in the plane z = ARM_Z; pivots are its joints in that plane. */
export const ARM_Z = 0.3;
export const SHOULDER: Vec3 = [-2.35, -0.75, ARM_Z];
export const ELBOW: Vec3 = [-1.45, 1.05, ARM_Z];
export const WRIST: Vec3 = [0.55, 0.45, ARM_Z];

export const BELT_START = -2.1;
export const BELT_END = 2.9;
const BELT_Y = -1.15;

/** A thick limb between two joints: points on its axis pushed out to a square section. */
const limb = (random: Random, from: Vec3, to: Vec3, thickness: number): Vec3 =>
  offset(onSegment(random, from, to), [
    between(random, -thickness, thickness),
    between(random, -thickness, thickness),
    random() < 0.5 ? -thickness : thickness,
  ]);

const finger = (random: Random): Vec3 =>
  onBox(
    random,
    [WRIST[0] + (random() < 0.5 ? -0.13 : 0.13), WRIST[1] - 0.42, ARM_Z],
    [0.05, 0.42, 0.12]
  );

const slat = (random: Random): Vec3 => {
  const x = BELT_START + Math.floor(random() * 26) * ((BELT_END - BELT_START) / 26);
  return [x, BELT_Y, between(random, -0.15, 0.75)];
};

const rail = (random: Random): Vec3 =>
  onBox(
    random,
    [(BELT_START + BELT_END) / 2, BELT_Y - 0.08, random() < 0.5 ? -0.22 : 0.82],
    [BELT_END - BELT_START, 0.14, 0.05]
  );

const leg = (random: Random): Vec3 => {
  const x = BELT_START + 0.3 + Math.floor(random() * 4) * ((BELT_END - BELT_START - 0.6) / 3);
  return onBox(random, [x, -1.55, 0.3], [0.08, 0.7, 0.9]);
};

const packet = (random: Random): Vec3 => {
  const slot = Math.floor(random() * 5);
  return onBox(random, [BELT_START + 0.5 + slot * 1, BELT_Y + 0.2, 0.3], [0.36, 0.34, 0.36]);
};

const scanCurtain = (random: Random): Vec3 =>
  jitter(
    random,
    onSegment(random, [WRIST[0], WRIST[1] - 0.9, -0.25], [WRIST[0], WRIST[1] - 0.9, 0.85]),
    0.01
  );

/** Pedestal, shoulder and the two limbs — the background robots reuse it. */
export const ARM_PARTS: readonly Part[] = [
  { weight: 0.08, sample: (r) => onCylinder(r, [SHOULDER[0], -1.6, ARM_Z], 0.42, 0.5) },
  { weight: 0.03, sample: (r) => offset(onRing(r, 0.1, 0.42, -1.1), [SHOULDER[0], 0, ARM_Z]) },
  { weight: 0.04, tag: UPPER_ARM, sample: (r) => onSphere(r, 0.22, SHOULDER) },
  { weight: 0.13, tag: UPPER_ARM, sample: (r) => limb(r, SHOULDER, ELBOW, 0.13) },
  { weight: 0.04, tag: FOREARM, sample: (r) => onSphere(r, 0.19, ELBOW) },
  { weight: 0.11, tag: FOREARM, sample: (r) => limb(r, ELBOW, WRIST, 0.1) },
  { weight: 0.03, tag: FOREARM, sample: (r) => onBox(r, WRIST, [0.3, 0.22, 0.26]) },
  { weight: 0.05, tag: FOREARM, sample: finger },
];

export const sampleRobot = (count: number, random: Random): Cloud =>
  fillCloud(
    count,
    [
      ...ARM_PARTS,
      { weight: 0.17, tag: CONVEYOR, sample: slat },
      { weight: 0.06, sample: rail },
      { weight: 0.05, sample: leg },
      { weight: 0.15, tag: CONVEYOR, sample: packet },
      { weight: 0.03, sample: scanCurtain },
    ],
    random
  );

export const sampleRobotArm = (count: number, random: Random): Cloud =>
  fillCloud(count, ARM_PARTS, random);
