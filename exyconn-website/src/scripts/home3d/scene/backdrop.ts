import {
  AdditiveBlending,
  Mesh,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  Vector2,
  type BufferGeometry,
} from "three";
import { createRandom } from "../../stage3d/math";
import type { QualityTier } from "../../stage3d/quality";
import {
  backdropFragment,
  backdropVertex,
  gridFragment,
  gridVertex,
} from "../../stage3d/shaders/backdrop";
import { onSphere } from "../../stage3d/shapes/sampling";
import { glowPointsMaterial, pointsGeometry } from "../../stage3d/materials";
import type { ScenePalette } from "../../stage3d/palette";
import { colorUniform } from "../../stage3d/uniforms";

/** Nebula sky, perspective grid floor and a parallax starfield. */
export interface Backdrop {
  nebula: Mesh<PlaneGeometry, ShaderMaterial>;
  grid: Mesh<PlaneGeometry, ShaderMaterial>;
  stars: Points<BufferGeometry, ShaderMaterial>;
}

const FLOOR_Y = -2.1;

export const createBackdrop = (palette: ScenePalette, tier: QualityTier): Backdrop => {
  const nebula = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({
      vertexShader: backdropVertex,
      fragmentShader: backdropFragment,
      defines: { OCTAVES: tier.nebulaOctaves },
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uResolution: { value: new Vector2(1, 1) },
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uFocus: { value: new Vector2(0.7, 0.5) },
        uTintAmount: { value: 0.2 },
        uDeep: colorUniform(palette.deep),
        uMid: colorUniform(palette.mid),
        uGlowA: colorUniform(palette.violet),
        uGlowB: colorUniform(palette.cyan),
        uTint: colorUniform(palette.violet),
        uScrimSide: { value: new Vector2(1, 0) },
      },
    })
  );
  nebula.frustumCulled = false;
  nebula.renderOrder = -10;

  const grid = new Mesh(
    new PlaneGeometry(36, 36),
    new ShaderMaterial({
      vertexShader: gridVertex,
      fragmentShader: gridFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uColor: colorUniform(palette.sky),
        uOpacity: { value: 0.3 },
        uTime: { value: 0 },
      },
    })
  );
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = FLOOR_Y;

  const random = createRandom(7);
  const starPositions = new Float32Array(tier.stars * 3);
  for (let i = 0; i < tier.stars; i += 1) {
    starPositions.set(onSphere(random, 22 + random() * 30), i * 3);
  }
  const stars = new Points(
    pointsGeometry(starPositions, random),
    glowPointsMaterial(palette.line, 2.4, tier.pixelRatio)
  );
  stars.frustumCulled = false;
  return { nebula, grid, stars };
};
