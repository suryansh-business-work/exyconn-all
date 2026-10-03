import {
  AdditiveBlending,
  CircleGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  Points,
  SRGBColorSpace,
  ShaderMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Color,
} from "three";
import { createRandom } from "../math";
import type { QualityTier } from "../quality";
import { radarFragment, uvVertex } from "../shaders/backdrop";
import { sampleJetSilhouette } from "../shapes/aviation";
import { sampleRobotArm } from "../shapes/robotics";
import { sampleSatellite } from "../shapes/space";
import { glowPointsMaterial, pointsGeometry } from "./materials";
import type { ScenePalette } from "./palette";
import { colorUniform } from "./uniforms";

/**
 * What lives around the protagonist: the radar sweep under the jet, the neural filaments
 * inside the core, and the background worlds — planes crossing far behind, a row of robot
 * arms on the floor, satellites on wide orbits — each faded in with its chapter.
 */
export interface World {
  group: Group;
  material: ShaderMaterial;
}

export interface Accents {
  radar: Mesh<CircleGeometry, ShaderMaterial>;
  filaments: LineSegments<BufferGeometry, LineBasicMaterial> | null;
  planes: World;
  robots: World;
  satellites: World;
}

const world = (
  positions: Float32Array,
  copies: number,
  color: [number, number, number],
  size: number,
  pixelRatio: number,
  seed: number
): World => {
  const geometry = pointsGeometry(positions, createRandom(seed));
  const material = glowPointsMaterial(color, size, pixelRatio);
  const group = new Group();
  for (let i = 0; i < copies; i += 1) {
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    group.add(points);
  }
  return { group, material };
};

export const createAccents = (
  palette: ScenePalette,
  tier: QualityTier,
  filamentPositions: Float32Array
): Accents => {
  const radar = new Mesh(
    new CircleGeometry(3, 72),
    new ShaderMaterial({
      vertexShader: uvVertex,
      fragmentShader: radarFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uColor: colorUniform(palette.cyan), uOpacity: { value: 0 }, uTime: { value: 0 } },
    })
  );
  radar.rotation.x = -Math.PI / 2;
  radar.position.y = -1.46;

  let filaments: Accents["filaments"] = null;
  if (filamentPositions.length > 0) {
    const [r, g, b] = palette.violet;
    filaments = new LineSegments(
      new BufferGeometry().setAttribute(
        "position",
        new Float32BufferAttribute(filamentPositions, 3)
      ),
      new LineBasicMaterial({
        color: new Color().setRGB(r, g, b, SRGBColorSpace),
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
      })
    );
  }

  const count = tier.ambientPoints;
  const ratio = tier.pixelRatio;
  return {
    radar,
    filaments,
    planes: world(
      sampleJetSilhouette(count, createRandom(11)).positions,
      3,
      palette.sky,
      2.2,
      ratio,
      12
    ),
    robots: world(
      sampleRobotArm(count, createRandom(13)).positions,
      4,
      palette.amber,
      2.2,
      ratio,
      14
    ),
    satellites: world(
      sampleSatellite(Math.round(count / 2), createRandom(15)).positions,
      4,
      palette.fuchsia,
      2.6,
      ratio,
      16
    ),
  };
};
