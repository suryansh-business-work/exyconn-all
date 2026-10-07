import { describe, expect, it } from "vitest";
import { arcPoints, createLines } from "../../../../../src/scripts/stage3d/shapes/lines";
import type { Vec3 } from "../../../../../src/scripts/stage3d/shapes/sampling";
import { points } from "./helpers";

const close = (point: Vec3) => point.map((value) => expect.closeTo(value, 9));

describe("createLines", () => {
  it("starts empty", () => {
    const set = createLines().build();
    expect(set.positions).toHaveLength(0);
    expect(set.order).toHaveLength(0);
    expect(set.flow).toHaveLength(0);
    expect(set.along).toHaveLength(0);
  });

  it("records a segment as two vertices built together, without packets", () => {
    const lines = createLines();
    lines.segment([0, 0, 0], [1, 2, 3], 0.5);
    const set = lines.build();
    expect([...set.positions]).toEqual([0, 0, 0, 1, 2, 3]);
    expect([...set.order]).toEqual([0.5, 0.5]);
    expect([...set.flow]).toEqual([0, 0]);
    expect([...set.along]).toEqual([0, 1]);
  });

  it("builds a path along its length and flags a data link's packets", () => {
    const lines = createLines();
    lines.path(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      0,
      1,
      true
    );
    const set = lines.build();
    expect(points(set.positions)).toEqual([
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
    ]);
    expect([...set.order]).toEqual([0, 0, 0.5, 0.5]);
    expect([...set.flow]).toEqual([1, 1, 1, 1]);
    expect([...set.along]).toEqual([0, 0.5, 0.5, 1]);
  });

  it("draws nothing for a path of one point and no packets on a plain path", () => {
    const lines = createLines();
    lines.path([[1, 1, 1]], 0, 1, true);
    expect(lines.build().positions).toHaveLength(0);
    lines.path(
      [
        [0, 0, 0],
        [0, 1, 0],
      ],
      0.2,
      0.4
    );
    expect([...lines.build().flow]).toEqual([0, 0]);
  });

  it("draws a box's twelve edges, base and pillars first and the top last", () => {
    const lines = createLines();
    lines.box([0, 0, 0], [2, 4, 6], 0.1, 0.9);
    const set = lines.build();
    const vertices = points(set.positions);
    expect(vertices).toHaveLength(24);
    expect(
      vertices.every(([x, y, z]) => Math.abs(x) === 1 && Math.abs(y) === 2 && Math.abs(z) === 3)
    ).toBe(true);
    expect(vertices.slice(0, 8).every(([, y]) => y === -2)).toBe(true);
    expect(vertices.slice(16).every(([, y]) => y === 2)).toBe(true);
    // Each pillar rises from the base to the top at one corner.
    for (let edge = 0; edge < 4; edge += 1) {
      const [bottom, top] = vertices.slice(8 + edge * 2, 10 + edge * 2);
      expect([bottom[0], bottom[1], bottom[2]]).toEqual([top[0], -2, top[2]]);
      expect(top[1]).toBe(2);
    }
    expect([...set.order]).toEqual(
      [...Array(16).fill(0.1), ...Array(8).fill(0.9)].map((v) => expect.closeTo(v, 6))
    );
    expect([...set.flow].every((value) => value === 0)).toBe(true);
  });

  it("builds fresh buffers each time", () => {
    const lines = createLines();
    lines.segment([0, 0, 0], [1, 0, 0], 0);
    const first = lines.build();
    lines.segment([0, 0, 0], [0, 1, 0], 1);
    expect(first.positions).toHaveLength(6);
    expect(lines.build().positions).toHaveLength(12);
  });
});

describe("arcPoints", () => {
  it("bends a quadratic arc up through the lifted midpoint", () => {
    expect(arcPoints([0, 0, 0], [2, 0, 0], 1, 2)).toEqual([
      close([0, 0, 0]),
      close([1, 0.5, 0]),
      close([2, 0, 0]),
    ]);
  });

  it("uses sixteen steps by default and ends on both endpoints", () => {
    const arc = arcPoints([0, 0, 0], [0, 0, 4], -1);
    expect(arc).toHaveLength(17);
    expect(arc[0]).toEqual(close([0, 0, 0]));
    expect(arc[16]).toEqual(close([0, 0, 4]));
    expect(arc[8][1]).toBeCloseTo(-0.5);
  });
});
