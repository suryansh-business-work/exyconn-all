import {
  Group,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  type Material,
  type Object3D,
} from "three";
import type { QualityTier } from "../quality";
import { buildTargets } from "../shapes";
import { createAccents } from "./accents";
import { createBackdrop } from "./backdrop";
import type { Stage } from "./frame";
import { createHud } from "./hud";
import { readPalette } from "./palette";
import { createProtagonist } from "./protagonist";

/** Assembles the renderer and every object of the scene for one quality tier. */
export interface Built {
  renderer: WebGLRenderer;
  scene: Scene;
  stage: Stage;
  setPixelRatio: (ratio: number) => void;
  dispose: () => void;
}

const disposeObject = (object: Object3D): void => {
  const { geometry, material } = object as Object3D & {
    geometry?: { dispose: () => void };
    material?: Material;
  };
  geometry?.dispose();
  material?.dispose();
};

export const buildScene = (
  stageElement: HTMLElement,
  host: HTMLElement,
  tier: QualityTier,
  compact: boolean
): Built => {
  const palette = readPalette(stageElement);
  const renderer = new WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(tier.pixelRatio);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);

  const targets = buildTargets(tier.particles, tier.filaments);
  const protagonist = createProtagonist(targets, palette, tier.pixelRatio, compact);
  const hud = createHud(palette.line, palette.orange);
  const backdrop = createBackdrop(palette, tier);
  const accents = createAccents(palette, tier, targets.filaments);

  const root = new Group();
  root.add(protagonist.points, accents.radar);
  if (accents.filaments) {
    root.add(accents.filaments);
  }
  const scene = new Scene();
  scene.add(backdrop.nebula, backdrop.grid, backdrop.stars, root, hud.group);
  scene.add(accents.planes.group, accents.robots.group, accents.satellites.group);

  const camera = new PerspectiveCamera(40, 1, 0.1, 120);
  const pointMaterials = [
    protagonist.material,
    backdrop.stars.material,
    accents.planes.material,
    accents.robots.material,
    accents.satellites.material,
  ];

  return {
    renderer,
    scene,
    stage: { camera, root, protagonist, hud, backdrop, accents, palette },
    setPixelRatio: (ratio) => {
      renderer.setPixelRatio(ratio);
      pointMaterials.forEach((material) => {
        material.uniforms.uPixelRatio.value = ratio;
      });
    },
    dispose: () => {
      scene.traverse(disposeObject);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
};
