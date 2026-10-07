import { AdditiveBlending } from "three";
import { describe, expect, it } from "vitest";
import { glowPointsMaterial, pointsGeometry } from "../../../../src/scripts/stage3d/materials";
import { glowFragment, simplePointsVertex } from "../../../../src/scripts/stage3d/shaders/points";

describe("glowPointsMaterial", () => {
  it("is an additive sprite with no depth test, starting invisible", () => {
    const material = glowPointsMaterial([0.2, 0.4, 0.6], 2.4, 1.5);
    expect(material.vertexShader).toBe(simplePointsVertex);
    expect(material.fragmentShader).toBe(glowFragment);
    expect(material.blending).toBe(AdditiveBlending);
    expect(material.transparent).toBe(true);
    expect(material.depthTest).toBe(false);
    expect(material.depthWrite).toBe(false);
    expect(material.uniforms.uOpacity.value).toBe(0);
  });

  it("carries its colour, size and pixel ratio as uniforms", () => {
    const { uniforms } = glowPointsMaterial([0.2, 0.4, 0.6], 2.4, 1.5);
    expect(uniforms.uColor.value.toArray()).toEqual([0.2, 0.4, 0.6]);
    expect(uniforms.uSize.value).toBe(2.4);
    expect(uniforms.uPixelRatio.value).toBe(1.5);
    expect(uniforms.uTime.value).toBe(0);
  });
});

describe("pointsGeometry", () => {
  it("keeps the positions and gives each point its own twinkle phase", () => {
    const positions = new Float32Array([0, 0, 0, 1, 1, 1, 2, 2, 2]);
    const phases = [0.1, 0.5, 0.9];
    let call = 0;
    const geometry = pointsGeometry(positions, () => phases[call++]);
    expect(geometry.getAttribute("position").array).toBe(positions);
    expect(geometry.getAttribute("position").count).toBe(3);
    const phase = geometry.getAttribute("aPhase");
    expect(phase.itemSize).toBe(1);
    expect(Array.from(phase.array)).toEqual(phases.map((value) => Math.fround(value)));
  });

  it("builds an empty geometry for no points", () => {
    const geometry = pointsGeometry(new Float32Array(0), () => 0.5);
    expect(geometry.getAttribute("aPhase").count).toBe(0);
  });
});
