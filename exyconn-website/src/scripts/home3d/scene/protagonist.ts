import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
  Vector2,
} from "three";
import { glowFragment, particleVertex } from "../shaders/particles";
import type { Targets } from "../shapes";
import { TRAIL_END, ENGINE_X, WINGTIP_X } from "../shapes/aviation";
import { BELT_END, BELT_START, ELBOW, SHOULDER } from "../shapes/robotics";
import { PLANET_TILT } from "../shapes/space";
import type { ScenePalette } from "./palette";
import { colorUniform, tiltMatrix, vec3 } from "./uniforms";

/**
 * The AI core and everything it becomes: one Points draw call whose vertex shader morphs
 * between the four precomputed worlds.
 */
export interface Protagonist {
  points: Points<BufferGeometry, ShaderMaterial>;
  material: ShaderMaterial;
}

export const createProtagonist = (
  targets: Targets,
  palette: ScenePalette,
  pixelRatio: number,
  compact: boolean
): Protagonist => {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(targets.core, 3));
  geometry.setAttribute("aJet", new BufferAttribute(targets.jet, 3));
  geometry.setAttribute("aRobot", new BufferAttribute(targets.robot, 3));
  geometry.setAttribute("aPlanet", new BufferAttribute(targets.planet, 3));
  geometry.setAttribute("aAnim", new BufferAttribute(targets.anim, 4));

  const material = new ShaderMaterial({
    vertexShader: particleVertex,
    fragmentShader: glowFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uStory: { value: 0 },
      uScatter: { value: compact ? 0.6 : 0.9 },
      uSize: { value: compact ? 1.9 : 1.6 },
      uPixelRatio: { value: pixelRatio },
      uBlueprint: { value: 1 },
      uOpacity: { value: 1 },
      uColA: colorUniform(palette.violet),
      uColB: colorUniform(palette.fuchsia),
      uColC: colorUniform(palette.cyan),
      uColLine: colorUniform(palette.line),
      uTint: colorUniform(palette.violet),
      uShoulder: { value: vec3(SHOULDER) },
      uElbow: { value: vec3(ELBOW) },
      uArm: { value: new Vector2() },
      uTilt: { value: tiltMatrix(PLANET_TILT.x, PLANET_TILT.z) },
      uBelt: { value: new Vector2(BELT_START, BELT_END) },
      uTrail: { value: vec3([TRAIL_END, ENGINE_X, WINGTIP_X]) },
    },
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  return { points, material };
};
