import { describe, expect, it } from "vitest";
import { createRandom } from "../../../../../src/scripts/stage3d/math";
import {
  ENGINE_TRAIL,
  ENGINE_X,
  sampleJet,
  sampleJetSilhouette,
  TRAIL_END,
  WINGTIP_TRAIL,
} from "../../../../../src/scripts/stage3d/shapes/aviation";
import {
  ARM_Z,
  BELT_END,
  BELT_START,
  CONVEYOR,
  FOREARM,
  sampleRobot,
  sampleRobotArm,
  STATIC,
  UPPER_ARM,
} from "../../../../../src/scripts/stage3d/shapes/robotics";
import {
  PLANET_RADIUS,
  sampleSatellite,
  sampleSpace,
  satellite,
  SPIN,
} from "../../../../../src/scripts/stage3d/shapes/space";
import { counting, points, sequence, tagged, tagSet } from "./helpers";

const N = 2000;
const rng = () => createRandom(4);

describe("aviation", () => {
  it("streams engine and wingtip contrails back to the trail's end", () => {
    const cloud = sampleJet(N, rng());
    expect(tagSet(cloud.tags)).toEqual([0, ENGINE_TRAIL, WINGTIP_TRAIL]);
    const engine = tagged(cloud.positions, cloud.tags, ENGINE_TRAIL);
    expect(engine.every(([x]) => x <= ENGINE_X + 0.03 && x >= TRAIL_END - 0.03)).toBe(true);
    expect(engine.every(([, y]) => Math.abs(y + 0.28) <= 0.03)).toBe(true);
    const wingtip = tagged(cloud.positions, cloud.tags, WINGTIP_TRAIL);
    expect(wingtip.every(([, , z]) => Math.abs(Math.abs(z) - 2) <= 0.03)).toBe(true);
    expect(Math.min(...points(cloud.positions).map(([x]) => x))).toBeLessThan(-4);
  });

  it("draws the bare airframe for the background planes", () => {
    const cloud = sampleJetSilhouette(800, rng());
    expect(cloud.positions).toHaveLength(2400);
    expect(tagSet(cloud.tags)).toEqual([0]);
    const xs = points(cloud.positions).map(([x]) => x);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(-2.11);
    expect(Math.max(...xs)).toBeLessThanOrEqual(2.11);
  });
});

describe("robotics", () => {
  it("tags the arm by joint and the belt as conveyor", () => {
    const cloud = sampleRobot(N, rng());
    expect(tagSet(cloud.tags)).toEqual([STATIC, UPPER_ARM, FOREARM, CONVEYOR]);
    const belt = tagged(cloud.positions, cloud.tags, CONVEYOR);
    expect(belt.every(([x, y]) => y >= -1.16 && y <= -0.77 && x >= BELT_START - 0.2)).toBe(true);
    expect(belt.every(([x]) => x <= BELT_END)).toBe(true);
  });

  it("draws the arm alone, in its working plane, for the background robots", () => {
    const cloud = sampleRobotArm(900, rng());
    expect(cloud.positions).toHaveLength(2700);
    expect(tagSet(cloud.tags)).toEqual([STATIC, UPPER_ARM, FOREARM]);
    const limbs = points(cloud.positions).filter((_, i) => cloud.tags[i] !== STATIC);
    expect(limbs.every(([, , z]) => Math.abs(z - ARM_Z) <= 0.23)).toBe(true);
  });
});

describe("space", () => {
  it("spins each body at its own rate", () => {
    const cloud = sampleSpace(N, rng());
    expect(tagSet(cloud.tags)).toEqual(
      [0, SPIN.planet, SPIN.rings, SPIN.moon, SPIN.satellites].map((v) => expect.closeTo(v, 6))
    );
  });

  it("keeps the last candidate when every latitude band rejects it", () => {
    // Draws near 1 put the point on the equator, which the bands reject every time.
    const rejecting = counting(sequence(0.9999));
    const cloud = sampleSpace(3, rejecting.random);
    const [planet] = points(cloud.positions);
    expect(Math.hypot(...planet)).toBeCloseTo(PLANET_RADIUS, 4);
    expect(cloud.tags[0]).toBeCloseTo(SPIN.planet);
    // One candidate, then six rejected attempts of a test and a new candidate each; the
    // remaining two points are the moon (two draws each).
    expect(rejecting.calls()).toBe(2 + 6 * 3 + 2 * 2);

    const accepting = counting(sequence(0.1));
    sampleSpace(3, accepting.random);
    expect(accepting.calls()).toBe(2 + 1 + 2 * 2);
  });

  it("builds a satellite from a body and two panels", () => {
    expect(satellite(sequence(0.1, 0.5))).toEqual([0, 0.1, 0].map((v) => expect.closeTo(v, 9)));
    expect(satellite(sequence(0.5))[0]).toBeCloseTo(-0.34);
    expect(satellite(sequence(0.9, 0.5))[0]).toBeCloseTo(0.34);
    expect(satellite(sequence(0.1, 0.5), [5, 1, 0])).toEqual(
      [5, 1.1, 0].map((v) => expect.closeTo(v, 9))
    );
  });

  it("samples a lone satellite round the origin", () => {
    const cloud = sampleSatellite(600, rng());
    expect(tagSet(cloud.tags)).toEqual([0]);
    expect(
      points(cloud.positions).every(
        ([x, y, z]) => Math.abs(x) <= 0.551 && Math.abs(y) <= 0.101 && Math.abs(z) <= 0.131
      )
    ).toBe(true);
  });
});
