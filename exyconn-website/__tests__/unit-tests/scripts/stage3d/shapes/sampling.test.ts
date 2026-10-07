import { describe, expect, it } from "vitest";
import { createRandom } from "../../../../../src/scripts/stage3d/math";
import {
  between,
  fillCloud,
  inSphere,
  jitter,
  offset,
  onArc,
  onBox,
  onCylinder,
  onRing,
  onSegment,
  onSphere,
  onTriangle,
  tiltX,
  tiltZ,
  type Part,
  type Vec3,
} from "../../../../../src/scripts/stage3d/shapes/sampling";
import { sequence } from "./helpers";

const close = (point: Vec3) => point.map((value) => expect.closeTo(value, 9));

describe("primitive samplers", () => {
  it("maps a random draw onto a range", () => {
    expect(between(sequence(0.25), 2, 6)).toBe(3);
    expect(between(sequence(0), -1, 1)).toBe(-1);
  });

  it("places sphere points on the surface, or inside it, about a centre", () => {
    expect(onSphere(sequence(0.5, 0.25), 2, [1, 1, 1])).toEqual(close([1, 3, 1]));
    expect(onSphere(sequence(0.5, 0.25), 1)).toEqual(close([0, 1, 0]));
    // The first draw shrinks the radius by its cube root: cbrt(0.125) = 0.5.
    expect(inSphere(sequence(0.125, 0.5, 0.25), 2)).toEqual(close([0, 1, 0]));
    const random = createRandom(7);
    for (let i = 0; i < 200; i += 1) {
      expect(Math.hypot(...onSphere(random, 1.5))).toBeCloseTo(1.5, 9);
      const [x, y, z] = inSphere(random, 0.8, [2, 0, 0]);
      expect(Math.hypot(x - 2, y, z)).toBeLessThanOrEqual(0.8 + 1e-9);
    }
  });

  it("biases segment points towards the start", () => {
    expect(onSegment(sequence(0.5), [0, 0, 0], [4, 0, 0])).toEqual([2, 0, 0]);
    expect(onSegment(sequence(0.5), [0, 0, 0], [4, 0, 0], 2)).toEqual([1, 0, 0]);
  });

  it("folds triangle draws outside the triangle back inside it", () => {
    const a: Vec3 = [0, 0, 0];
    const b: Vec3 = [1, 0, 0];
    const c: Vec3 = [0, 1, 0];
    expect(onTriangle(sequence(0.2, 0.3), a, b, c)).toEqual(close([0.2, 0.3, 0]));
    expect(onTriangle(sequence(0.8, 0.6), a, b, c)).toEqual(close([0.2, 0.4, 0]));
  });

  it("keeps box points on one of the box's faces", () => {
    const random = createRandom(3);
    const centre: Vec3 = [1, -1, 2];
    const size: Vec3 = [2, 0.5, 1];
    for (let i = 0; i < 300; i += 1) {
      const point = onBox(random, centre, size);
      const reach = point.map((value, axis) => Math.abs(value - centre[axis]) / size[axis]);
      expect(reach.every((value) => value <= 0.5 + 1e-9)).toBe(true);
      expect(reach.some((value) => Math.abs(value - 0.5) < 1e-9)).toBe(true);
    }
  });

  it("places cylinder, ring and arc points at their radius", () => {
    expect(onCylinder(sequence(0.5, 0.25), [1, 0, 0], 2, 3)).toEqual(close([-1, 0.75, 0]));
    expect(onRing(sequence(0, 0.5), 1, 3, 2)).toEqual(close([Math.sqrt(5), 2, 0]));
    expect(onRing(sequence(0, 0), 1, 3)).toEqual(close([1, 0, 0]));
    expect(onArc(sequence(0.5), 2, 0, Math.PI)).toEqual(close([0, 0, 2]));
  });

  it("rotates, moves and jitters points", () => {
    expect(tiltX([0, 1, 0], Math.PI / 2)).toEqual(close([0, 0, 1]));
    expect(tiltZ([1, 0, 0], Math.PI / 2)).toEqual(close([0, 1, 0]));
    expect(offset([1, 2, 3], [1, 1, 1])).toEqual([2, 3, 4]);
    expect(jitter(sequence(0.5), [1, 2, 3], 0.1)).toEqual(close([1, 2, 3]));
    expect(jitter(sequence(0, 1, 0.5), [1, 2, 3], 0.1)).toEqual(close([0.9, 2.1, 3]));
  });
});

describe("fillCloud", () => {
  const fixed =
    (point: Vec3): Part["sample"] =>
    () =>
      point;

  it("shares the budget by weight and gives the last part the rounding", () => {
    const parts: Part[] = [1, 2, 3].map((tag) => ({ weight: 1, tag, sample: fixed([tag, 0, 0]) }));
    const cloud = fillCloud(7, parts, sequence(0.5));
    expect([...cloud.tags]).toEqual([1, 1, 2, 2, 3, 3, 3]);
    expect(cloud.positions.slice(0, 3)).toEqual(Float32Array.from([1, 0, 0]));
    expect(cloud.positions.slice(18, 21)).toEqual(Float32Array.from([3, 0, 0]));
    expect(cloud).not.toHaveProperty("order");
  });

  it("hands a budget smaller than the parts to the last part", () => {
    const parts: Part[] = [1, 2, 3].map((tag) => ({ weight: 1, tag, sample: fixed([0, 0, 0]) }));
    expect([...fillCloud(2, parts, sequence(0.5)).tags]).toEqual([3, 3]);
  });

  it("tags untagged parts 0 and orders unordered parts at random once any part is ordered", () => {
    const cloud = fillCloud(
      4,
      [
        { weight: 1, tag: 4, sample: fixed([1, 2, 3]), order: (p) => p[0] / 4 },
        { weight: 1, sample: fixed([0, 0, 0]) },
      ],
      sequence(0.75)
    );
    expect([...cloud.tags]).toEqual([4, 4, 0, 0]);
    expect([...(cloud.order ?? [])]).toEqual([0.25, 0.25, 0.75, 0.75]);
  });
});
