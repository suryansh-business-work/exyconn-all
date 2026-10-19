/** Industry kit edge cases: a polyline with a zero-length leg, and a weighted portico. */
import { describe, expect, it } from "vitest";
import { onPolyline } from "../../../../../../src/scripts/stage3d/shapes/industries/kit";
import { porticoParts } from "../../../../../../src/scripts/stage3d/shapes/industries/portico";

const fixed = (value: number) => () => value;

describe("onPolyline", () => {
  it("stays on a leg of zero length instead of dividing by it", () => {
    const point = onPolyline(
      fixed(0),
      [
        [1, 2, 3],
        [1, 2, 3],
      ],
      0
    );
    expect(point.every(Number.isFinite)).toBe(true);
    expect(point.map((v) => Math.round(v * 100) / 100)).toEqual([1, 2, 3]);
  });

  it("spreads points along the legs in proportion to their length", () => {
    const legs: [number, number, number][] = [
      [0, 0, 0],
      [1, 0, 0],
      [1, 3, 0],
    ];
    // Three quarters of the way along a 4-long line is two thirds up the second leg.
    const [x, y, z] = onPolyline(fixed(0.75), legs, 0);
    expect(x).toBeCloseTo(1);
    expect(y).toBeCloseTo(2);
    expect(z).toBeCloseTo(0);
  });
});

describe("porticoParts", () => {
  const portico = { x: 0, z: 0, width: 2, columns: 4, height: 1, gable: 0.3, from: 0, to: 1 };

  it("weights its parts by one by default and scales them all by `weight`", () => {
    const plain = porticoParts(portico).map((part) => part.weight);
    const heavy = porticoParts({ ...portico, weight: 2 }).map((part) => part.weight);
    expect(plain).toEqual([0.45, 1.3, 0.4, 0.35, 0.3]);
    heavy.forEach((weight, i) => expect(weight).toBeCloseTo(plain[i] * 2));
  });
});
