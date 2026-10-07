import {
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Points,
  PointsMaterial,
  type BufferGeometry,
  type Object3D,
} from "three";
import { describe, expect, it } from "vitest";
import { createHud } from "../../../../../src/scripts/home3d/scene/hud";
import { expectRgb, palette, srgbOf } from "./scene-fixtures";

type Drawn = Object3D & { geometry: BufferGeometry; material: LineBasicMaterial };

const build = () => createHud(palette.line, palette.orange);
const parts = (hud: ReturnType<typeof build>) => hud.group.children as Drawn[];
const vertexCount = (part: Drawn) => part.geometry.getAttribute("position").count;
const vertex = (part: Drawn, index: number): number[] => {
  const position = part.geometry.getAttribute("position");
  return [position.getX(index), position.getY(index), position.getZ(index)];
};

describe("createHud layout", () => {
  it("draws two circles with their handles, a tick ring and the construction lines", () => {
    const [outer, outerBars, outerDots, inner, innerBars, innerDots, ticks, guides] =
      parts(build());
    expect(parts(build())).toHaveLength(8);
    expect(outer).toBeInstanceOf(Line);
    expect(inner).toBeInstanceOf(Line);
    [outerBars, innerBars, ticks, guides].forEach((part) =>
      expect(part).toBeInstanceOf(LineSegments)
    );
    [outerDots, innerDots].forEach((part) => expect(part).toBeInstanceOf(Points));
  });

  it("closes each circle on its radius", () => {
    const [outer, , , inner] = parts(build());
    expect(vertexCount(outer)).toBe(161);
    expect(vertex(outer, 0)[0]).toBeCloseTo(1.75);
    expect(vertex(outer, 160)[0]).toBeCloseTo(1.75);
    expect(vertex(outer, 40)[1]).toBeCloseTo(1.75);
    expect(vertex(inner, 0)[0]).toBeCloseTo(1.1);
  });

  it("puts a tangent bar and three dots on each side of a circle", () => {
    const [, bars, dots] = parts(build());
    expect(vertexCount(bars)).toBe(8);
    expect(vertexCount(dots)).toBe(12);
    // The top handle: a horizontal bar centred on (0, 1.75), its middle dot on the circle.
    expect(vertex(bars, 0)[1]).toBeCloseTo(1.75);
    expect(vertex(bars, 1)[1]).toBeCloseTo(1.75);
    expect(vertex(bars, 1)[0] - vertex(bars, 0)[0]).toBeCloseTo(2 * 1.75 * 0.32);
    expect(vertex(dots, 1)[0]).toBeCloseTo(0);
    expect(vertex(dots, 1)[1]).toBeCloseTo(1.75);
  });

  it("draws 72 ticks with a long one every sixth", () => {
    const ticks = parts(build())[6];
    expect(vertexCount(ticks)).toBe(144);
    expect(vertex(ticks, 0)[0]).toBeCloseTo(1.97);
    expect(vertex(ticks, 1)[0]).toBeCloseTo(2.09);
    const shortEnd = Math.hypot(...vertex(ticks, 3));
    expect(shortEnd).toBeCloseTo(2.02);
  });

  it("dashes the circles and the construction lines", () => {
    const [outer, , , , , , , guides] = parts(build());
    expect(outer.geometry.getAttribute("lineDistance")).toBeDefined();
    expect(guides.geometry.getAttribute("lineDistance")).toBeDefined();
    expect(vertexCount(guides)).toBe(16);
    expect(outer.material).toBeInstanceOf(LineDashedMaterial);
  });

  it("paints lines in the line colour and handles in the accent", () => {
    const [outer, bars, dots] = parts(build());
    expectRgb(srgbOf(outer.material.color), palette.line);
    expectRgb(srgbOf(bars.material.color), palette.orange);
    expect(dots.material).toBeInstanceOf(PointsMaterial);
    expectRgb(srgbOf((dots.material as unknown as PointsMaterial).color), palette.orange);
  });
});

describe("createHud opacity", () => {
  it("scales each layer by its own level and hides when faint", () => {
    const hud = build();
    const [outer, bars, dots, , , , , guides] = parts(hud);
    hud.setOpacity(0.5);
    expect(hud.group.visible).toBe(true);
    expect(outer.material.opacity).toBeCloseTo(0.375);
    expect(guides.material.opacity).toBeCloseTo(0.11);
    expect(bars.material.opacity).toBeCloseTo(0.475);
    expect(dots.material.opacity).toBeCloseTo(0.5);

    hud.setOpacity(0.01);
    expect(hud.group.visible).toBe(false);
    hud.setOpacity(0);
    expect(hud.group.visible).toBe(false);
    expect(bars.material.opacity).toBe(0);
  });
});
