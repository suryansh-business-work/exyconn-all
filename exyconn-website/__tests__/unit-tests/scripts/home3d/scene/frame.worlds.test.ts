import { Group, PerspectiveCamera } from "three";
import { describe, expect, it } from "vitest";
import { createAccents } from "../../../../../src/scripts/home3d/scene/accents";
import { createBackdrop } from "../../../../../src/scripts/home3d/scene/backdrop";
import { applyFrame, type Motion, type Stage } from "../../../../../src/scripts/home3d/scene/frame";
import { createHud } from "../../../../../src/scripts/home3d/scene/hud";
import { createProtagonist } from "../../../../../src/scripts/home3d/scene/protagonist";
import { buildTargets } from "../../../../../src/scripts/home3d/shapes";
import { palette, tier, xyz } from "./scene-fixtures";

const targets = buildTargets(120, 0);

const makeStage = (): Stage => ({
  camera: new PerspectiveCamera(40, 1, 0.1, 120),
  root: new Group(),
  protagonist: createProtagonist(targets, palette, 1, false),
  hud: createHud(palette.line, palette.orange),
  backdrop: createBackdrop(palette, tier()),
  accents: createAccents(palette, tier(), targets.filaments),
  palette,
});

const frame = (stage: Stage, story: number, time = 0) => {
  const motion: Motion = {
    time,
    story,
    blueprint: 0,
    pointerX: 0,
    pointerY: 0,
    lean: 0,
    scrollY: 0,
    viewportHeight: 1000,
  };
  applyFrame(stage, motion, false);
};

describe("applyFrame background worlds", () => {
  it("fades each world in with its own chapter only", () => {
    const stage = makeStage();
    const { planes, robots, satellites } = stage.accents;
    const shown = () => [planes.group.visible, robots.group.visible, satellites.group.visible];

    frame(stage, 0);
    expect(shown()).toEqual([false, false, false]);
    frame(stage, 1);
    expect(shown()).toEqual([true, false, false]);
    expect(planes.material.uniforms.uOpacity.value).toBeCloseTo(0.9);
    frame(stage, 2);
    expect(shown()).toEqual([false, true, false]);
    expect(robots.material.uniforms.uOpacity.value).toBeCloseTo(0.8);
    frame(stage, 3);
    expect(shown()).toEqual([false, false, true]);
    expect(satellites.material.uniforms.uOpacity.value).toBeCloseTo(0.9);
  });

  it("flies the planes across the back, smaller the further they are", () => {
    const stage = makeStage();
    const [first, second] = stage.accents.planes.group.children;
    frame(stage, 1);
    expect(xyz(first.position)).toEqual([-16, 2.4, -11]);
    expect(first.scale.x).toBeCloseTo(0.55);
    expect(second.position.x).toBeCloseTo(-5);
    expect(second.position.y).toBeCloseTo(3.6);
    expect(second.position.z).toBe(-14);
    expect(second.scale.x).toBeCloseTo(0.47);
  });

  it("re-enters a plane at the far edge once it leaves the near one", () => {
    const stage = makeStage();
    const [first] = stage.accents.planes.group.children;
    frame(stage, 1, 30);
    // -16 + 30 × 1.3 = 23, which wraps round the 36-unit span to -13.
    expect(first.position.x).toBeCloseTo(-13);
  });

  it("stands the robots in a row on the floor, each rocking on its own phase", () => {
    const stage = makeStage();
    const robots = stage.accents.robots.group.children;
    frame(stage, 2);
    expect(robots.map((robot) => robot.position.x)).toEqual([-9, -4.6, 4.6, 9]);
    robots.forEach((robot, i) => {
      expect(robot.position.y).toBe(-1.14);
      expect(robot.position.z).toBe(-6.5);
      expect(robot.scale.x).toBeCloseTo(0.6);
      expect(robot.rotation.z).toBeCloseTo(Math.sin(i * 1.7) * 0.08);
    });
  });

  it("spaces the satellites a quarter turn apart on a wide orbit", () => {
    const stage = makeStage();
    const satellites = stage.accents.satellites.group.children;
    frame(stage, 3);
    expect(satellites[0].position.x).toBeCloseTo(10);
    expect(satellites[0].position.y).toBeCloseTo(3);
    expect(satellites[0].position.z).toBeCloseTo(-6);
    expect(satellites[1].position.x).toBeCloseTo(0);
    expect(satellites[1].position.z).toBeCloseTo(4);
    expect(satellites[1].rotation.y).toBeCloseTo(Math.PI / 2);
  });

  it("advances every world's twinkle clock", () => {
    const stage = makeStage();
    frame(stage, 1, 7);
    const { planes, robots, satellites } = stage.accents;
    [planes, robots, satellites].forEach((world) =>
      expect(world.material.uniforms.uTime.value).toBe(7)
    );
  });
});
