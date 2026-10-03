import { WebGLRenderer, type Material, type Object3D, type Scene } from "three";

/**
 * The renderer every stage starts from, and the one way a scene is torn down: every
 * geometry and material freed, the context released and the canvas removed.
 */
export const createRenderer = (host: HTMLElement, pixelRatio: number, alpha = false) => {
  const renderer = new WebGLRenderer({ antialias: false, alpha });
  renderer.setPixelRatio(pixelRatio);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  return renderer;
};

export const disposeObject = (object: Object3D): void => {
  const { geometry, material } = object as Object3D & {
    geometry?: { dispose: () => void };
    material?: Material;
  };
  geometry?.dispose();
  material?.dispose();
};

export const disposeScene = (scene: Scene, renderer: WebGLRenderer): void => {
  scene.traverse(disposeObject);
  renderer.dispose();
  renderer.domElement.remove();
};
