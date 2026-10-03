import * as THREE from 'three';
import { SCENE_COLORS, seededRandom } from './palette';

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aPhase;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.15 + aPhase) * 0.6;
    p.y += cos(uTime * 0.2 + aPhase * 1.3) * 0.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (14.0 / -mv.z);
    vColor = color;
    vTwinkle = 0.55 + 0.45 * sin(uTime * 1.4 + aPhase * 4.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.0, d) * vTwinkle;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export interface ParticleField {
  readonly points: THREE.Points;
  update(time: number): void;
  dispose(): void;
}

/** Soft twinkling points drifting inside a box of `spread`. */
export function createParticleField(count: number, spread: THREE.Vector3, pixelRatio: number): ParticleField {
  const random = seededRandom(19);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const color = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    positions.set([(random() - 0.5) * spread.x, (random() - 0.5) * spread.y, (random() - 0.5) * spread.z], i * 3);
    color.set(SCENE_COLORS[i % SCENE_COLORS.length]);
    colors.set([color.r, color.g, color.b], i * 3);
    sizes[i] = 1 + random() * 2.5;
    phases[i] = random() * Math.PI * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);

  return {
    points,
    update: (time: number) => {
      material.uniforms.uTime.value = time;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}
