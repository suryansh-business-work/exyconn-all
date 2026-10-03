import { Vector3, type Group, type PerspectiveCamera } from "three";
import { poseAt } from "../camera-path";
import { wrap } from "../math";
import { hudOpacity, shapeWeights } from "../story";
import type { Accents } from "./accents";
import type { Backdrop } from "./backdrop";
import type { Hud } from "./hud";
import type { ScenePalette, SceneColor } from "./palette";
import type { Protagonist } from "./protagonist";
import { blendColors } from "./uniforms";

/**
 * One frame of the story: given the damped motion state, place the camera and subject and
 * fade each world in or out with its chapter. No allocation per frame beyond the pose.
 */
export interface Stage {
  camera: PerspectiveCamera;
  root: Group;
  protagonist: Protagonist;
  hud: Hud;
  backdrop: Backdrop;
  accents: Accents;
  palette: ScenePalette;
}

export interface Motion {
  time: number;
  story: number;
  blueprint: number;
  pointerX: number;
  pointerY: number;
  /** Scroll-velocity lean, radians. */
  lean: number;
  scrollY: number;
  viewportHeight: number;
}

/** The glow each world casts on its surroundings, in SHAPES order. */
const WORLD_TINTS: readonly SceneColor[] = ["violet", "sky", "amber", "fuchsia"];
const ROBOT_SLOTS = [-9, -4.6, 4.6, 9];
const projected = new Vector3();

const placeWorlds = (
  { planes, robots, satellites }: Accents,
  time: number,
  weights: readonly number[]
): void => {
  planes.material.uniforms.uOpacity.value = weights[1] * 0.9;
  robots.material.uniforms.uOpacity.value = weights[2] * 0.8;
  satellites.material.uniforms.uOpacity.value = weights[3] * 0.9;
  planes.group.visible = weights[1] > 0.01;
  robots.group.visible = weights[2] > 0.01;
  satellites.group.visible = weights[3] > 0.01;
  planes.group.children.forEach((plane, i) => {
    plane.position.set(
      wrap(-16 + i * 11 + time * (1.3 + i * 0.35), -18, 18),
      2.4 + i * 1.2,
      -11 - i * 3
    );
    plane.scale.setScalar(0.55 - i * 0.08);
  });
  robots.group.children.forEach((robot, i) => {
    robot.position.set(ROBOT_SLOTS[i], -1.14, -6.5);
    robot.scale.setScalar(0.6);
    robot.rotation.z = Math.sin(time * 0.8 + i * 1.7) * 0.08;
  });
  satellites.group.children.forEach((satellite, i) => {
    const angle = time * 0.07 + (i * Math.PI) / 2;
    satellite.position.set(
      Math.cos(angle) * 10,
      3 + Math.sin(angle * 2) * 1.5,
      Math.sin(angle) * 10 - 6
    );
    satellite.rotation.y = angle;
  });
  [planes, robots, satellites].forEach(({ material }) => {
    material.uniforms.uTime.value = time;
  });
};

export const applyFrame = (stage: Stage, motion: Motion, compact: boolean): void => {
  const { camera, root, protagonist, hud, backdrop, accents, palette } = stage;
  const { time, story, blueprint } = motion;
  const weights = shapeWeights(story);
  const pose = poseAt(story, compact);

  camera.position.set(
    pose.camera[0] + motion.pointerX * 0.35,
    pose.camera[1] + motion.pointerY * 0.2,
    pose.camera[2]
  );
  camera.lookAt(0, 0, 0);
  root.position.set(pose.offset[0], pose.offset[1], 0);
  root.rotation.set(
    pose.pitch + motion.pointerY * 0.1 + motion.lean,
    pose.yaw + motion.pointerX * 0.18 + Math.sin(time * 0.3) * 0.05,
    0
  );
  root.scale.setScalar(pose.scale * (1 + Math.sin(time * 0.9) * 0.015));

  const uniforms = protagonist.material.uniforms;
  uniforms.uTime.value = time;
  uniforms.uStory.value = story;
  uniforms.uBlueprint.value = blueprint;
  uniforms.uArm.value.set(Math.sin(time * 0.9) * 0.16, Math.sin(time * 0.9 + 1.1) * 0.3);
  const tints = WORLD_TINTS.map((name) => palette[name]);
  blendColors(uniforms.uTint.value, tints, weights);

  hud.group.position.copy(root.position);
  hud.group.quaternion.copy(camera.quaternion);
  hud.group.scale.setScalar(pose.scale);
  hud.setOpacity(hudOpacity(blueprint, story));

  accents.radar.material.uniforms.uOpacity.value = weights[1];
  accents.radar.material.uniforms.uTime.value = time;
  accents.radar.visible = weights[1] > 0.01;
  if (accents.filaments) {
    accents.filaments.material.opacity = weights[0] * (1 - blueprint) * 0.3;
    accents.filaments.rotation.y = -time * 0.12;
  }
  placeWorlds(accents, time, weights);

  const sky = backdrop.nebula.material.uniforms;
  sky.uTime.value = time;
  sky.uScroll.value = (motion.scrollY / Math.max(1, motion.viewportHeight)) * 0.1;
  blendColors(sky.uTint.value, tints, weights);
  projected.copy(root.position).project(camera);
  sky.uFocus.value.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);
  backdrop.grid.material.uniforms.uTime.value = time;
  backdrop.grid.material.uniforms.uOpacity.value = 0.18 + blueprint * 0.4 + weights[2] * 0.55;
  backdrop.stars.material.uniforms.uTime.value = time;
  backdrop.stars.material.uniforms.uOpacity.value = 0.45 + weights[3] * 0.55;
};
