/** The detail stages' 2D marks: arcs, circles, rounded boxes, cogs and the named glyphs. */
import { describe, expect, it } from "vitest";
import { arc, circle, gear, GLYPHS, roundedRect } from "../../../../src/lib/detail/glyphs";

type Path = readonly (readonly [number, number])[];

const inUnitSquare = (path: Path) => path.every(([x, y]) => Math.abs(x) <= 1 && Math.abs(y) <= 1);
const closed = (path: Path) => path[0][0] === path.at(-1)?.[0] && path[0][1] === path.at(-1)?.[1];

describe("arc", () => {
  it("steps from one angle to the other, rounded to three decimals and never -0", () => {
    const path = arc(0, 0, 1, 0, Math.PI, 2);
    expect(path).toEqual([
      [1, 0],
      [0, 1],
      [-1, 0],
    ]);
    expect(Object.is(path[1][0], -0)).toBe(false);
    expect(arc(0.5, -0.5, 0.25, 0, Math.PI / 2, 1)).toEqual([
      [0.75, -0.5],
      [0.5, -0.25],
    ]);
  });

  it("draws 24 steps by default", () => {
    expect(arc(0, 0, 1, 0, 1)).toHaveLength(25);
  });
});

describe("circle", () => {
  it("closes on itself with 32 steps by default", () => {
    const ring = circle(0, 0, 0.5);
    expect(ring).toHaveLength(33);
    expect(closed(ring)).toBe(true);
    expect(circle(0, 0, 0.5, 8)).toHaveLength(9);
  });
});

describe("roundedRect", () => {
  it("is a closed outline of four corner arcs inside its box", () => {
    const box = roundedRect(-0.5, -0.25, 0.5, 0.25, 0.1);
    expect(box).toHaveLength(4 * 7 + 1);
    expect(closed(box)).toBe(true);
    expect(box.every(([x, y]) => Math.abs(x) <= 0.5 && Math.abs(y) <= 0.25)).toBe(true);
    expect(box[0]).toEqual([0.4, -0.25]);
  });
});

describe("gear", () => {
  it("draws four points per tooth between the radii and closes", () => {
    const cog = gear(0, 0, 0.9, 0.7, 6);
    expect(cog).toHaveLength(6 * 4 + 1);
    expect(closed(cog)).toBe(true);
    expect(cog[0]).toEqual([0.7, 0]);
    cog.forEach(([x, y]) => {
      const radius = Math.hypot(x, y);
      expect(radius).toBeGreaterThan(0.69);
      expect(radius).toBeLessThan(0.91);
    });
  });
});

describe("GLYPHS", () => {
  it("names a mark for each service stage", () => {
    expect(Object.keys(GLYPHS).toSorted((a, b) => a.localeCompare(b))).toEqual([
      "building",
      "bulb",
      "chart",
      "chatBubbles",
      "cloud",
      "cog",
      "phone",
      "plug",
      "rotate",
    ]);
  });

  it("keeps every path inside the unit square with at least two points", () => {
    Object.entries(GLYPHS).forEach(([name, paths]) => {
      expect(paths.length, name).toBeGreaterThan(0);
      paths.forEach((path) => {
        expect(path.length, name).toBeGreaterThanOrEqual(2);
        expect(inUnitSquare(path), name).toBe(true);
      });
    });
  });

  it("draws the building's twelve windows plus its outline and door", () => {
    expect(GLYPHS.building).toHaveLength(14);
    expect(GLYPHS.cog).toHaveLength(2);
  });
});
