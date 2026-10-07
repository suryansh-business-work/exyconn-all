import { Group, PerspectiveCamera } from "three";
import { describe, expect, it } from "vitest";
import { createAccents } from "../../../../../src/scripts/home3d/scene/accents";
import { createBackdrop } from "../../../../../src/scripts/home3d/scene/backdrop";
import { applyFrame, type Motion, type Stage } from "../../../../../src/scripts/home3d/scene/frame";
import { createHud } from "../../../../../src/scripts/home3d/scene/hud";
import { createProtagonist } from "../../../../../src/scripts/home3d/scene/protagonist";
import { buildTargets } from "../../../../../src/scripts/home3d/shapes";
import { expectRgb, palette, tier, xyz } from "./scene-fixtures";

const withFilaments = buildTargets(200, 10);
const withoutFilaments = buildTargets(200, 0);

const makeStage = (filaments = true): Stage => {
  const targets = filaments ? withFilaments : withoutFilaments;
  return {
    camera: new PerspectiveCamera(40, 1, 0.1, 120),
    root: new Group(),
    protagonist: createProtagonist(targets, palette, 1, false),
    hud: createHud(palette.line, palette.orange),
    backdrop: createBackdrop(palette, tier()),
    accents: createAccents(palette, tier(), targets.filaments),
    palette,
  };
};

const motion = (overrides: Partial<Motion> = {}): Motion => ({
  time: 0,
  story: 0,
  blueprint: 1,
  pointerX: 0,
  pointerY: 0,
  lean: 0,
  scrollY: 0,
  viewportHeight: 1000,
  ...overrides,
});

const mix = (a: readonly number[], b: readonly number[]): [number, number, number] => [
  (a[0] + b[0]) / 2,
  (a[1] + b[1]) / 2,
  (a[2] + b[2]) / 2,
];

describe("applyFrame camera and subject", () => {
  it("poses the camera with pointer parallax and pushes the subject right on wide screens", () => {
    const stage = makeStage();
    applyFrame(stage, motion({ pointerX: 1, pointerY: -1 }), false);
    expect(xyz(stage.camera.position)).toEqual([0.35, 0.3 - 0.2, 7.4]);
    expect(xyz(stage.root.position)).toEqual([1.9, 0, 0]);
  });

  it("centres the subject in the upper half on compact screens", () => {
    const stage = makeStage();
    applyFrame(stage, motion(), true);
    expect(xyz(stage.root.position)).toEqual([0, 1.75, 0]);
    expect(stage.root.scale.x).toBeCloseTo(0.8);
  });

  it("tilts the subject with the pointer and the scroll lean", () => {
    const stage = makeStage();
    applyFrame(stage, motion({ pointerX: 0.5, pointerY: 0.5, lean: 0.05 }), false);
    expect(stage.root.rotation.x).toBeCloseTo(0.1);
    expect(stage.root.rotation.y).toBeCloseTo(0.09);
    expect(stage.root.scale.x).toBeCloseTo(1);
  });
});

describe("applyFrame protagonist", () => {
  it("passes time, story and blueprint to the shader and swings the arm", () => {
    const stage = makeStage();
    applyFrame(stage, motion({ time: 0, story: 0.4, blueprint: 0.3 }), false);
    const { uniforms } = stage.protagonist.material;
    expect(uniforms.uStory.value).toBe(0.4);
    expect(uniforms.uBlueprint.value).toBe(0.3);
    expect(uniforms.uArm.value.x).toBeCloseTo(0);
    expect(uniforms.uArm.value.y).toBeCloseTo(Math.sin(1.1) * 0.3);
  });

  it("tints with each world's glow, blending between neighbours", () => {
    const stage = makeStage();
    const tint = () => xyz(stage.protagonist.material.uniforms.uTint.value);
    applyFrame(stage, motion({ story: 0 }), false);
    expectRgb(tint(), palette.violet);
    applyFrame(stage, motion({ story: 1 }), false);
    expectRgb(tint(), palette.sky);
    applyFrame(stage, motion({ story: 1.5 }), false);
    expectRgb(tint(), mix(palette.sky, palette.amber));
    expectRgb(
      xyz(stage.backdrop.nebula.material.uniforms.uTint.value),
      mix(palette.sky, palette.amber)
    );
  });
});

describe("applyFrame overlay and accents", () => {
  it("keeps the HUD on the subject, facing the camera, and fades it after the blueprint", () => {
    const stage = makeStage();
    applyFrame(stage, motion({ blueprint: 1 }), false);
    expect(xyz(stage.hud.group.position)).toEqual(xyz(stage.root.position));
    expect(stage.hud.group.quaternion.equals(stage.camera.quaternion)).toBe(true);
    expect(stage.hud.group.visible).toBe(true);
    applyFrame(stage, motion({ blueprint: 0, story: 2 }), false);
    expect(stage.hud.group.visible).toBe(false);
    expect(stage.hud.group.scale.x).toBeCloseTo(0.6);
  });

  it("shows the radar only in the jet chapter", () => {
    const stage = makeStage();
    const { radar } = stage.accents;
    applyFrame(stage, motion({ story: 1, time: 3 }), false);
    expect(radar.visible).toBe(true);
    expect(radar.material.uniforms.uOpacity.value).toBeCloseTo(1);
    expect(radar.material.uniforms.uTime.value).toBe(3);
    applyFrame(stage, motion({ story: 0 }), false);
    expect(radar.visible).toBe(false);
  });

  it("lights the filaments inside the formed core and turns them with time", () => {
    const stage = makeStage();
    applyFrame(stage, motion({ story: 0, blueprint: 0, time: 2 }), false);
    expect(stage.accents.filaments?.material.opacity).toBeCloseTo(0.3);
    expect(stage.accents.filaments?.rotation.y).toBeCloseTo(-0.24);
    applyFrame(stage, motion({ story: 0, blueprint: 1 }), false);
    expect(stage.accents.filaments?.material.opacity).toBe(0);
  });

  it("draws a frame for a tier without filaments", () => {
    const stage = makeStage(false);
    expect(() => applyFrame(stage, motion(), false)).not.toThrow();
    expect(stage.accents.filaments).toBeNull();
  });
});

describe("applyFrame backdrop", () => {
  it("scrolls the sky by viewport heights and points its glow at the subject", () => {
    const stage = makeStage();
    applyFrame(stage, motion({ scrollY: 500, time: 4 }), false);
    const sky = stage.backdrop.nebula.material.uniforms;
    expect(sky.uScroll.value).toBeCloseTo(0.05);
    expect(sky.uTime.value).toBe(4);
    expect(sky.uFocus.value.x).toBeGreaterThan(0.5);
    expect(sky.uFocus.value.y).toBeLessThan(0.5);

    applyFrame(stage, motion({ scrollY: 500, viewportHeight: 0 }), true);
    expect(sky.uScroll.value).toBeCloseTo(50);
    expect(sky.uFocus.value.x).toBeCloseTo(0.5);
  });

  it("brightens the grid for the blueprint and the robots, and the stars for space", () => {
    const stage = makeStage();
    const { grid, stars } = stage.backdrop;
    applyFrame(stage, motion({ story: 2, blueprint: 0, time: 1 }), false);
    expect(grid.material.uniforms.uOpacity.value).toBeCloseTo(0.73);
    expect(grid.material.uniforms.uTime.value).toBe(1);
    expect(stars.material.uniforms.uOpacity.value).toBeCloseTo(0.45);
    applyFrame(stage, motion({ story: 3, blueprint: 1 }), false);
    expect(grid.material.uniforms.uOpacity.value).toBeCloseTo(0.58);
    expect(stars.material.uniforms.uOpacity.value).toBeCloseTo(1);
  });
});
