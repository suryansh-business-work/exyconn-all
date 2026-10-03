import * as THREE from 'three';
import { SCENE_COLORS, seededRandom } from './palette';

/** Neon wire cubes: faces almost transparent, edges glowing in the instance colour. */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  void main() {
    vUv = uv;
    vColor = instanceColor;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  void main() {
    float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float glow = smoothstep(0.09, 0.0, edge);
    gl_FragColor = vec4(vColor, 0.05 + glow * 0.85);
  }
`;

export interface CubeField {
  readonly mesh: THREE.InstancedMesh;
  update(time: number): void;
  dispose(): void;
}

interface CubeSeed {
  base: THREE.Vector3;
  spin: THREE.Vector3;
  phase: number;
  scale: number;
}

/** `count` cubes spread over a box of `spread` (x, y, z) around the origin. */
export function createCubeField(count: number, spread: THREE.Vector3): CubeField {
  const random = seededRandom(7);
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const seeds: CubeSeed[] = [];
  const color = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    seeds.push({
      base: new THREE.Vector3((random() - 0.5) * spread.x, (random() - 0.5) * spread.y, (random() - 0.5) * spread.z),
      spin: new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).multiplyScalar(0.6),
      phase: random() * Math.PI * 2,
      scale: 0.18 + random() ** 2 * 0.55,
    });
    mesh.setColorAt(i, color.set(SCENE_COLORS[i % SCENE_COLORS.length]));
  }

  const dummy = new THREE.Object3D();
  const update = (time: number) => {
    seeds.forEach((seed, i) => {
      dummy.position.set(seed.base.x, seed.base.y + Math.sin(time * 0.6 + seed.phase) * 0.35, seed.base.z);
      dummy.rotation.set(seed.spin.x * time + seed.phase, seed.spin.y * time, seed.spin.z * time);
      dummy.scale.setScalar(seed.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  update(0);

  return {
    mesh,
    update,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}
