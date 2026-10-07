import { AdditiveBlending, CircleGeometry, LineSegments, Points } from "three";
import { describe, expect, it } from "vitest";
import { createAccents } from "../../../../../src/scripts/home3d/scene/accents";
import { radarFragment } from "../../../../../src/scripts/stage3d/shaders/backdrop";
import { declaredUniforms, expectRgb, palette, srgbOf, tier, xyz } from "./scene-fixtures";

const filaments = new Float32Array([0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1]);

describe("createAccents radar", () => {
  it("lays a cyan additive sweep flat under the jet, hidden until its chapter", () => {
    const { radar } = createAccents(palette, tier(), filaments);
    expect(radar.geometry).toBeInstanceOf(CircleGeometry);
    expect(radar.rotation.x).toBeCloseTo(-Math.PI / 2);
    expect(radar.position.y).toBeCloseTo(-1.46);
    expect(radar.material.blending).toBe(AdditiveBlending);
    expect(radar.material.depthWrite).toBe(false);
    expect(radar.material.uniforms.uOpacity.value).toBe(0);
    expectRgb(xyz(radar.material.uniforms.uColor.value), palette.cyan);
  });

  it("only sets uniforms its fragment shader declares", () => {
    const { radar } = createAccents(palette, tier(), filaments);
    expect(declaredUniforms(radarFragment)).toEqual(
      expect.arrayContaining(Object.keys(radar.material.uniforms))
    );
  });
});

describe("createAccents filaments", () => {
  it("draws the given segments in violet, starting invisible", () => {
    const accents = createAccents(palette, tier(), filaments);
    const lines = accents.filaments;
    expect(lines).toBeInstanceOf(LineSegments);
    if (!lines) {
      throw new Error("filaments were not built");
    }
    expect(lines.geometry.getAttribute("position").count).toBe(4);
    expect(lines.material.opacity).toBe(0);
    expect(lines.material.transparent).toBe(true);
    expectRgb(srgbOf(lines.material.color), palette.violet);
  });

  it("draws none when the tier has no filaments", () => {
    expect(createAccents(palette, tier(), new Float32Array(0)).filaments).toBeNull();
  });
});

describe("createAccents background worlds", () => {
  it("builds three planes, four robots and four satellites, each sharing one cloud", () => {
    const { planes, robots, satellites } = createAccents(palette, tier(), filaments);
    expect(planes.group.children).toHaveLength(3);
    expect(robots.group.children).toHaveLength(4);
    expect(satellites.group.children).toHaveLength(4);
    for (const world of [planes, robots, satellites]) {
      const copies = world.group.children as Points[];
      copies.forEach((copy) => {
        expect(copy).toBeInstanceOf(Points);
        expect(copy.frustumCulled).toBe(false);
        expect(copy.material).toBe(world.material);
        expect(copy.geometry).toBe(copies[0].geometry);
      });
    }
  });

  it("sizes each cloud from the tier's ambient budget, satellites at half", () => {
    const { planes, robots, satellites } = createAccents(palette, tier(), filaments);
    const count = (world: typeof planes) =>
      (world.group.children[0] as Points).geometry.getAttribute("position").count;
    expect(count(planes)).toBe(40);
    expect(count(robots)).toBe(40);
    expect(count(satellites)).toBe(20);
    const phases = (planes.group.children[0] as Points).geometry.getAttribute("aPhase");
    expect(phases.count).toBe(40);
  });

  it("paints each world in its chapter colour at the tier's pixel ratio", () => {
    const { planes, robots, satellites } = createAccents(
      palette,
      tier({ pixelRatio: 1.5 }),
      filaments
    );
    expectRgb(xyz(planes.material.uniforms.uColor.value), palette.sky);
    expectRgb(xyz(robots.material.uniforms.uColor.value), palette.amber);
    expectRgb(xyz(satellites.material.uniforms.uColor.value), palette.fuchsia);
    expect(planes.material.uniforms.uSize.value).toBe(2.2);
    expect(satellites.material.uniforms.uSize.value).toBe(2.6);
    expect(robots.material.uniforms.uPixelRatio.value).toBe(1.5);
  });

  it("samples the same clouds on every build", () => {
    const first = createAccents(palette, tier(), filaments);
    const second = createAccents(palette, tier(), filaments);
    const positions = (world: typeof first.robots) =>
      (world.group.children[0] as Points).geometry.getAttribute("position").array;
    expect(positions(second.robots)).toEqual(positions(first.robots));
  });
});
