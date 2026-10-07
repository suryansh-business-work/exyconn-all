import { AdditiveBlending, PlaneGeometry } from "three";
import { describe, expect, it } from "vitest";
import { createBackdrop } from "../../../../../src/scripts/home3d/scene/backdrop";
import { simplePointsVertex } from "../../../../../src/scripts/stage3d/shaders/points";
import {
  backdropFragment,
  gridFragment,
} from "../../../../../src/scripts/stage3d/shaders/backdrop";
import { declaredUniforms, expectRgb, palette, tier, xyz } from "./scene-fixtures";

describe("createBackdrop nebula", () => {
  it("is a full-screen sky drawn first, with the tier's fbm octaves", () => {
    const { nebula } = createBackdrop(palette, tier({ nebulaOctaves: 4 }));
    expect(nebula.geometry).toBeInstanceOf(PlaneGeometry);
    expect(nebula.material.defines).toEqual({ OCTAVES: 4 });
    expect(nebula.material.depthTest).toBe(false);
    expect(nebula.frustumCulled).toBe(false);
    expect(nebula.renderOrder).toBe(-10);
  });

  it("starts from the palette's night colours with the scrim on the left", () => {
    const { uniforms } = createBackdrop(palette, tier()).nebula.material;
    expectRgb(xyz(uniforms.uDeep.value), palette.deep);
    expectRgb(xyz(uniforms.uMid.value), palette.mid);
    expectRgb(xyz(uniforms.uGlowA.value), palette.violet);
    expectRgb(xyz(uniforms.uGlowB.value), palette.cyan);
    expectRgb(xyz(uniforms.uTint.value), palette.violet);
    expect(uniforms.uScrimSide.value.toArray()).toEqual([1, 0]);
    expect(uniforms.uFocus.value.toArray()).toEqual([0.7, 0.5]);
  });

  it("only sets uniforms its fragment shader declares", () => {
    const { nebula, grid } = createBackdrop(palette, tier());
    expect(declaredUniforms(backdropFragment)).toEqual(
      expect.arrayContaining(Object.keys(nebula.material.uniforms))
    );
    expect(declaredUniforms(gridFragment)).toEqual(
      expect.arrayContaining(Object.keys(grid.material.uniforms))
    );
  });
});

describe("createBackdrop grid", () => {
  it("lies flat on the floor as an additive sky-blue glow", () => {
    const { grid } = createBackdrop(palette, tier());
    expect(grid.rotation.x).toBeCloseTo(-Math.PI / 2);
    expect(grid.position.y).toBeCloseTo(-2.1);
    expect(grid.material.blending).toBe(AdditiveBlending);
    expect(grid.material.uniforms.uOpacity.value).toBe(0.3);
    expectRgb(xyz(grid.material.uniforms.uColor.value), palette.sky);
  });
});

describe("createBackdrop stars", () => {
  it("scatters the tier's star count on a shell between 22 and 52 units out", () => {
    const { stars } = createBackdrop(palette, tier({ stars: 80 }));
    const position = stars.geometry.getAttribute("position");
    expect(position.count).toBe(80);
    for (let i = 0; i < position.count; i += 1) {
      const distance = Math.hypot(position.getX(i), position.getY(i), position.getZ(i));
      expect(distance).toBeGreaterThanOrEqual(22 - 1e-4);
      expect(distance).toBeLessThanOrEqual(52 + 1e-4);
    }
    expect(stars.frustumCulled).toBe(false);
  });

  it("glows in the line colour at the tier's pixel ratio", () => {
    const { stars } = createBackdrop(palette, tier({ pixelRatio: 1.5 }));
    expectRgb(xyz(stars.material.uniforms.uColor.value), palette.line);
    expect(stars.material.uniforms.uSize.value).toBe(2.4);
    expect(stars.material.uniforms.uPixelRatio.value).toBe(1.5);
    expect(declaredUniforms(simplePointsVertex)).toEqual(
      expect.arrayContaining(Object.keys(stars.material.uniforms))
    );
  });

  it("places the same stars on every visit", () => {
    const first = createBackdrop(palette, tier()).stars.geometry.getAttribute("position").array;
    const second = createBackdrop(palette, tier()).stars.geometry.getAttribute("position").array;
    expect(second).toEqual(first);
  });
});
