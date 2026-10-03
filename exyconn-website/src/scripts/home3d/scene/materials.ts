import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from "three";
import { glowFragment, simplePointsVertex } from "../shaders/particles";
import type { Random } from "../shapes/sampling";
import type { Rgb } from "./palette";
import { colorUniform } from "./uniforms";

/**
 * An additive glow-sprite material in one colour, for stars and the background worlds.
 * Additive glow needs no depth test (a sum does not depend on draw order), and skipping it
 * avoids dark tiles some drivers (Intel on Metal) leave behind depth-tested sprites.
 */
export const glowPointsMaterial = (color: Rgb, size: number, pixelRatio: number): ShaderMaterial =>
  new ShaderMaterial({
    vertexShader: simplePointsVertex,
    fragmentShader: glowFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: size },
      uPixelRatio: { value: pixelRatio },
      uOpacity: { value: 0 },
      uColor: colorUniform(color),
    },
  });

/** A points geometry with a random twinkle phase per point. */
export const pointsGeometry = (positions: Float32Array, random: Random): BufferGeometry => {
  const geometry = new BufferGeometry();
  const phases = Float32Array.from({ length: positions.length / 3 }, () => random());
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aPhase", new BufferAttribute(phases, 1));
  return geometry;
};
