import { describe, expect, it } from "vitest";
import { createRandom } from "../../src/scripts/home3d/math";
import {
  ENGINE_TRAIL,
  sampleJet,
  sampleJetSilhouette,
  TRAIL_END,
  WINGTIP_TRAIL,
} from "../../src/scripts/home3d/shapes/aviation";
import {
  CORE_RADIUS,
  coreNodes,
  linkNodes,
  linkPositions,
  sampleCore,
} from "../../src/scripts/home3d/shapes/core";
import { buildTargets } from "../../src/scripts/home3d/shapes";
import {
  BELT_END,
  BELT_START,
  CONVEYOR,
  FOREARM,
  sampleRobot,
  sampleRobotArm,
  UPPER_ARM,
} from "../../src/scripts/home3d/shapes/robotics";
import {
  between,
  fillCloud,
  inSphere,
  onBox,
  onCylinder,
  onSphere,
  onTriangle,
  tiltX,
  tiltZ,
  type Vec3,
} from "../../src/scripts/home3d/shapes/sampling";
import {
  PLANET_RADIUS,
  sampleSatellite,
  sampleSpace,
  satellite,
  SPIN,
} from "../../src/scripts/home3d/shapes/space";

const N = 4000;
const points = (positions: Float32Array): Vec3[] =>
  Array.from({ length: positions.length / 3 }, (_, i) => [
    positions[i * 3],
    positions[i * 3 + 1],
    positions[i * 3 + 2],
  ]);
const length = ([x, y, z]: Vec3) => Math.hypot(x, y, z);
const finite = (positions: Float32Array) => positions.every((v) => Number.isFinite(v));
const maxRadius = (positions: Float32Array) => Math.max(...points(positions).map(length));

describe("sampling primitives", () => {
  const random = createRandom(1);

  it("puts sphere points on the surface and ball points inside", () => {
    for (let i = 0; i < 200; i += 1) {
      expect(length(onSphere(random, 2))).toBeCloseTo(2, 5);
      expect(length(inSphere(random, 1))).toBeLessThanOrEqual(1.000001);
    }
  });

  it("keeps triangle points inside the triangle", () => {
    for (let i = 0; i < 200; i += 1) {
      const [x, y, z] = onTriangle(random, [0, 0, 0], [1, 0, 0], [0, 1, 0]);
      expect(x + y).toBeLessThanOrEqual(1.000001);
      expect(Math.min(x, y)).toBeGreaterThanOrEqual(0);
      expect(z).toBe(0);
    }
  });

  it("puts box points on one of its faces", () => {
    for (let i = 0; i < 300; i += 1) {
      const p = onBox(random, [0, 0, 0], [2, 4, 6]);
      const onFace = [p[0] / 2, p[1] / 4, p[2] / 6].some((v) => Math.abs(Math.abs(v) - 0.5) < 1e-9);
      expect(onFace).toBe(true);
    }
  });

  it("puts cylinder points on its side, within its height", () => {
    const [x, y, z] = onCylinder(random, [0, 1, 0], 0.5, 2);
    expect(Math.hypot(x, z)).toBeCloseTo(0.5, 6);
    expect(y).toBeGreaterThanOrEqual(1);
    expect(y).toBeLessThanOrEqual(3);
  });

  it("rotates without changing length", () => {
    expect(length(tiltX([1, 2, 3], 0.7))).toBeCloseTo(length([1, 2, 3]), 10);
    expect(length(tiltZ([1, 2, 3], 0.7))).toBeCloseTo(length([1, 2, 3]), 10);
  });

  it("stays within its range", () => {
    const value = between(random, 3, 4);
    expect(value).toBeGreaterThanOrEqual(3);
    expect(value).toBeLessThan(4);
  });

  it("shares the budget by weight and tags every point", () => {
    const cloud = fillCloud(
      10,
      [
        { weight: 1, tag: 5, sample: () => [1, 1, 1] },
        { weight: 1, sample: () => [2, 2, 2] },
      ],
      random
    );
    expect(Array.from(cloud.tags)).toEqual([5, 5, 5, 5, 5, 0, 0, 0, 0, 0]);
    expect(cloud.positions[27]).toBe(2);
  });
});

describe("core", () => {
  const random = createRandom(2);
  const nodes = coreNodes(random, 40);
  const links = linkNodes(nodes, 1.1, 60);

  it("links only close node pairs, nearest first, up to the limit", () => {
    expect(links.length).toBeLessThanOrEqual(60);
    const lengths = links.map(([a, b]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
    expect(lengths.every((l) => l < 1.1)).toBe(true);
    expect(lengths).toEqual(lengths.toSorted((a, b) => a - b));
    expect(linkPositions(links)).toHaveLength(links.length * 6);
  });

  it("fills the requested count inside the orb", () => {
    const cloud = sampleCore(N, random, nodes, links);
    expect(cloud.positions).toHaveLength(N * 3);
    expect(finite(cloud.positions)).toBe(true);
    expect(maxRadius(cloud.positions)).toBeLessThan(CORE_RADIUS + 0.1);
  });
});

describe("aviation", () => {
  it("draws a jet with streaming contrails and stays within its frame", () => {
    const cloud = sampleJet(N, createRandom(3));
    expect(cloud.positions).toHaveLength(N * 3);
    expect(finite(cloud.positions)).toBe(true);
    const tags = new Set(cloud.tags);
    expect(tags.has(ENGINE_TRAIL) && tags.has(WINGTIP_TRAIL)).toBe(true);
    const xs = points(cloud.positions).map(([x]) => x);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(TRAIL_END - 0.1);
    expect(maxRadius(cloud.positions)).toBeLessThan(6);
  });

  it("has an untagged silhouette for the background planes", () => {
    const cloud = sampleJetSilhouette(500, createRandom(4));
    expect(cloud.tags.every((t) => t === 0)).toBe(true);
    expect(maxRadius(cloud.positions)).toBeLessThan(2.5);
  });
});

describe("robotics", () => {
  it("tags arm joints and conveyor points, all inside the cell", () => {
    const cloud = sampleRobot(N, createRandom(5));
    const tags = new Set(cloud.tags);
    [UPPER_ARM, FOREARM, CONVEYOR].forEach((tag) => expect(tags.has(tag)).toBe(true));
    const conveyorXs = points(cloud.positions)
      .filter((_, i) => cloud.tags[i] === CONVEYOR)
      .map(([x]) => x);
    expect(Math.min(...conveyorXs)).toBeGreaterThanOrEqual(BELT_START - 0.2);
    expect(Math.max(...conveyorXs)).toBeLessThanOrEqual(BELT_END + 0.2);
    expect(maxRadius(cloud.positions)).toBeLessThan(4);
  });

  it("has an arm-only cloud for the background robots", () => {
    const cloud = sampleRobotArm(400, createRandom(6));
    expect(cloud.tags.includes(CONVEYOR)).toBe(false);
  });
});

describe("space", () => {
  it("spins planet, rings and satellites at their own rates and keeps orbit paths still", () => {
    const cloud = sampleSpace(N, createRandom(7));
    const tags = new Set(cloud.tags);
    Object.values(SPIN).forEach((rate) => expect(tags.has(Math.fround(rate))).toBe(true));
    expect(tags.has(0)).toBe(true);
    expect(maxRadius(cloud.positions)).toBeLessThan(4.5);
  });

  it("falls back to a plain surface point when the bands keep rejecting", () => {
    const cloud = sampleSpace(40, () => 0.999);
    expect(finite(cloud.positions)).toBe(true);
    expect(length(points(cloud.positions)[0])).toBeCloseTo(PLANET_RADIUS, 4);
  });

  it("builds a satellite around its centre", () => {
    const random = createRandom(8);
    for (let i = 0; i < 100; i += 1) {
      expect(length(satellite(random, [5, 0, 0])) - 5).toBeLessThan(0.7);
    }
    expect(sampleSatellite(100, random).positions).toHaveLength(300);
  });
});

describe("buildTargets", () => {
  it("samples every world at the same count, with animation data and filaments", () => {
    const targets = buildTargets(3000, 50);
    for (const cloud of [targets.core, targets.jet, targets.robot, targets.planet]) {
      expect(cloud).toHaveLength(9000);
    }
    expect(targets.anim).toHaveLength(12000);
    expect(targets.filaments).toHaveLength(300);
    expect(buildTargets(3000, 0).filaments).toHaveLength(0);
  });

  it("is deterministic", () => {
    expect(buildTargets(500, 10).jet).toEqual(buildTargets(500, 10).jet);
  });
});
