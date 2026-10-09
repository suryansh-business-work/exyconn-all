/**
 * The decorative WebGL scenes, loaded on demand after first paint (see SceneCanvas):
 *  - `hub`: a field of neon wire "tool cubes" over a perspective grid with drifting
 *    particles, tilting toward the pointer.
 *  - `band`: a compact particle band with a few cubes, for the tool-page header.
 */
import * as THREE from 'three';
import { neon } from '../theme/tokens';
import { createCubeField } from './cubes';
import { createParticleField } from './particles';
import { runWhileVisible } from './loop';
import { scaled, type QualitySettings } from './quality';

export type SceneVariant = 'hub' | 'band';

export interface SceneOptions {
  readonly variant: SceneVariant;
  readonly quality: QualitySettings;
  /** Reduced motion: draw one still frame and never animate. */
  readonly still: boolean;
}

const LAYOUT = {
  hub: { cubes: 1, particles: 1, spread: new THREE.Vector3(18, 12, 10), cameraZ: 14, offsetX: 5.5 },
  band: { cubes: 0.2, particles: 0.45, spread: new THREE.Vector3(26, 5, 6), cameraZ: 9, offsetX: 4 },
} as const;

function createGrid(): THREE.GridHelper {
  const grid = new THREE.GridHelper(60, 40, neon.violet, neon.violet);
  const material = grid.material as THREE.Material;
  material.transparent = true;
  material.opacity = 0.14;
  material.depthWrite = false;
  grid.position.y = -5;
  return grid;
}

/** Mounts a scene into `container` and returns its teardown. */
export function mountScene(container: HTMLElement, { variant, quality, still }: SceneOptions): () => void {
  const layout = LAYOUT[variant];
  const renderer = new THREE.WebGLRenderer({
    antialias: quality.antialias,
    alpha: true,
    powerPreference: 'high-performance',
  });
  const pixelRatio = Math.min(globalThis.devicePixelRatio || 1, quality.dprCap);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, layout.cameraZ);
  const group = new THREE.Group();
  group.position.x = layout.offsetX;
  scene.add(group);

  const cubes = createCubeField(scaled(quality.cubes, layout.cubes), layout.spread);
  const particles = createParticleField(scaled(quality.particles, layout.particles), layout.spread, pixelRatio);
  group.add(cubes.mesh, particles.points);
  const grid = variant === 'hub' ? createGrid() : null;
  if (grid) {
    scene.add(grid);
  }

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = container;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    // Narrow screens: centre the field so it sits behind the copy rather than off-canvas.
    group.position.x = width < 768 ? 0 : layout.offsetX;
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const pointer = { x: 0, y: 0 };
  const onPointer = (event: PointerEvent) => {
    pointer.x = (event.clientX / globalThis.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / globalThis.innerHeight) * 2 - 1;
  };

  const draw = (time: number) => {
    cubes.update(time);
    particles.update(time);
    group.rotation.y += (pointer.x * 0.35 + time * 0.02 - group.rotation.y) * 0.05;
    group.rotation.x += (pointer.y * 0.18 - group.rotation.x) * 0.05;
    if (grid) {
      grid.position.z = (time * 0.8) % 1.5;
    }
    renderer.render(scene, camera);
  };

  let stop = () => {};
  if (still) {
    draw(4);
  } else {
    globalThis.addEventListener('pointermove', onPointer, { passive: true });
    stop = runWhileVisible(container, draw);
  }

  return () => {
    stop();
    globalThis.removeEventListener('pointermove', onPointer);
    resizeObserver.disconnect();
    cubes.dispose();
    particles.dispose();
    grid?.geometry.dispose();
    grid?.material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
