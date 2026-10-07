import { AdditiveBlending, Points } from "three";
import { describe, expect, it } from "vitest";
import { createProtagonist } from "../../../../../src/scripts/home3d/scene/protagonist";
import { particleVertex } from "../../../../../src/scripts/home3d/shaders/particles";
import { buildTargets } from "../../../../../src/scripts/home3d/shapes";
import { ENGINE_X, TRAIL_END, WINGTIP_X } from "../../../../../src/scripts/stage3d/shapes/aviation";
import {
  BELT_END,
  BELT_START,
  ELBOW,
  SHOULDER,
} from "../../../../../src/scripts/stage3d/shapes/robotics";
import { PLANET_TILT } from "../../../../../src/scripts/stage3d/shapes/space";
import { tiltMatrix } from "../../../../../src/scripts/stage3d/uniforms";
import { declaredUniforms, expectRgb, palette, xyz } from "./scene-fixtures";

const targets = buildTargets(300, 0);

describe("createProtagonist geometry", () => {
  it("carries every point's position in all four worlds plus its animation data", () => {
    const { points } = createProtagonist(targets, palette, 1.25, false);
    const { geometry } = points;
    expect(points).toBeInstanceOf(Points);
    expect(points.frustumCulled).toBe(false);
    expect(geometry.getAttribute("position").array).toBe(targets.core);
    expect(geometry.getAttribute("aJet").array).toBe(targets.jet);
    expect(geometry.getAttribute("aRobot").array).toBe(targets.robot);
    expect(geometry.getAttribute("aPlanet").array).toBe(targets.planet);
    expect(geometry.getAttribute("aAnim").itemSize).toBe(4);
    ["position", "aJet", "aRobot", "aPlanet", "aAnim"].forEach((name) =>
      expect(geometry.getAttribute(name).count).toBe(300)
    );
  });

  it("declares in its vertex shader every attribute the geometry carries", () => {
    for (const name of ["aJet", "aRobot", "aPlanet", "aAnim"]) {
      expect(particleVertex).toMatch(new RegExp(String.raw`attribute vec\d ${name};`));
    }
  });
});

describe("createProtagonist material", () => {
  it("blends additively without depth and opens fully drawn as a blueprint", () => {
    const { material, points } = createProtagonist(targets, palette, 1.25, false);
    expect(points.material).toBe(material);
    expect(material.blending).toBe(AdditiveBlending);
    expect(material.depthTest).toBe(false);
    expect(material.depthWrite).toBe(false);
    expect(material.uniforms.uBlueprint.value).toBe(1);
    expect(material.uniforms.uStory.value).toBe(0);
    expect(material.uniforms.uPixelRatio.value).toBe(1.25);
  });

  it("scatters less and draws larger points on compact screens", () => {
    const wide = createProtagonist(targets, palette, 1, false).material.uniforms;
    const compact = createProtagonist(targets, palette, 1, true).material.uniforms;
    expect(wide.uScatter.value).toBe(0.9);
    expect(wide.uSize.value).toBe(1.6);
    expect(compact.uScatter.value).toBe(0.6);
    expect(compact.uSize.value).toBe(1.9);
  });

  it("paints from the palette, tinted violet to begin with", () => {
    const { uniforms } = createProtagonist(targets, palette, 1, false).material;
    expectRgb(xyz(uniforms.uColA.value), palette.violet);
    expectRgb(xyz(uniforms.uColB.value), palette.fuchsia);
    expectRgb(xyz(uniforms.uColC.value), palette.cyan);
    expectRgb(xyz(uniforms.uColLine.value), palette.line);
    expectRgb(xyz(uniforms.uTint.value), palette.violet);
  });

  it("passes the shapes' rig to the shader: arm joints, belt, contrails and planet tilt", () => {
    const { uniforms } = createProtagonist(targets, palette, 1, false).material;
    expect(xyz(uniforms.uShoulder.value)).toEqual(SHOULDER);
    expect(xyz(uniforms.uElbow.value)).toEqual(ELBOW);
    expect(uniforms.uBelt.value.toArray()).toEqual([BELT_START, BELT_END]);
    expect(xyz(uniforms.uTrail.value)).toEqual([TRAIL_END, ENGINE_X, WINGTIP_X]);
    expect(uniforms.uTilt.value.elements).toEqual(
      tiltMatrix(PLANET_TILT.x, PLANET_TILT.z).elements
    );
    expect(uniforms.uArm.value.toArray()).toEqual([0, 0]);
  });

  it("only sets uniforms the particle shader declares", () => {
    const { uniforms } = createProtagonist(targets, palette, 1, false).material;
    expect(declaredUniforms(particleVertex).toSorted((a, b) => a.localeCompare(b))).toEqual(
      Object.keys(uniforms).toSorted((a, b) => a.localeCompare(b))
    );
  });
});
