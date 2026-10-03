/**
 * The deep-space backdrop: a gradient between the night inks, two layers of drifting
 * nebula noise in the accent colours, a glow behind the protagonist in the chapter's tint,
 * a vignette, and a scrim on the reading side. OCTAVES is set per quality tier. The scrim
 * lives here rather than as a CSS overlay so no extra layer is composited over the canvas.
 */
export const backdropVertex = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`;

export const backdropFragment = /* glsl */ `
uniform vec2 uResolution;
uniform float uTime;
uniform float uScroll;
uniform vec2 uFocus;
uniform float uTintAmount;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uGlowA;
uniform vec3 uGlowB;
uniform vec3 uTint;
uniform vec2 uScrimSide;

// Dave Hoskins' hash12: stable across GPUs, no sin() precision cliffs.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < OCTAVES; i++) {
    value += amplitude * noise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float n = fbm(p * 1.6 + vec2(uTime * 0.012, -uScroll * 0.35));
  float m = fbm(p * 3.1 - vec2(uTime * 0.02, uScroll * 0.6) + n);
  vec3 color = mix(uDeep, uMid, smoothstep(0.0, 1.1, uv.y * 0.35 + n * 0.9));
  color += uGlowA * smoothstep(0.45, 0.95, m) * 0.32;
  color += uGlowB * smoothstep(0.55, 1.0, n) * 0.24;
  vec2 toFocus = (uv - uFocus) * vec2(aspect, 1.0);
  color += uTint * (1.0 - smoothstep(0.0, 0.8, length(toFocus))) * uTintAmount;
  color *= 1.0 - 0.5 * smoothstep(0.45, 1.15, length((uv - 0.5) * vec2(aspect * 0.8, 1.0)) * 1.4);
  // The reading side (left on wide screens, bottom on phones) sinks back towards the night.
  float scrim = (1.0 - smoothstep(0.0, 0.62, uv.x)) * uScrimSide.x + (1.0 - smoothstep(0.0, 0.5, uv.y)) * uScrimSide.y;
  color = mix(color, uDeep, scrim * 0.7);
  gl_FragColor = vec4(color, 1.0);
}
`;

/** The floor: a fine grid fading into the distance, with a scan ring sweeping outwards. */
export const gridVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const gridFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
varying vec3 vWorld;

void main() {
  vec2 g = vWorld.xz / 0.8;
  // Guard the derivative: at grazing angles it reaches 0 or infinity and a NaN paints black.
  vec2 w = max(fwidth(g), vec2(0.0001));
  vec2 cell = abs(fract(g - 0.5) - 0.5) / w;
  float line = 1.0 - min(min(cell.x, cell.y), 1.0);
  // Cells smaller than a pixel only shimmer, so the grid fades out before the horizon.
  line *= 1.0 - smoothstep(0.3, 1.0, max(w.x, w.y));
  float dist = length(vWorld.xz);
  float fade = 1.0 - smoothstep(3.0, 15.0, dist);
  float pulse = smoothstep(0.35, 0.0, abs(dist - mod(uTime * 2.2, 16.0)));
  gl_FragColor = vec4(uColor, line * (0.4 + pulse) * fade * uOpacity);
}
`;

/** The radar plate under the jet: range rings and a rotating sweep. */
export const radarFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;
  float angle = atan(p.y, p.x);
  float sweep = pow(1.0 - fract((angle - uTime * 1.1) / 6.2831853), 12.0);
  float rings = 1.0 - smoothstep(0.0, 0.025, abs(fract(r * 4.0 + 0.5) - 0.5));
  gl_FragColor = vec4(uColor, (sweep * 0.22 * (1.0 - r) + rings * 0.12 * (1.0 - r)) * uOpacity);
}
`;

export const uvVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
