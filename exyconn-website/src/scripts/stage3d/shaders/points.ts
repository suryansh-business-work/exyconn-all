/**
 * Point-sprite shaders shared by the home and inner stages. A soft round sprite with a hot
 * centre: additive blending turns overlaps into glow.
 */
export const glowFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float glow = exp(-d * d * 6.0) + (1.0 - d) * 0.3;
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
`;

/** Stars and the small background worlds: fixed colour, gentle twinkle. */
export const simplePointsVertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uOpacity;
uniform vec3 uColor;

attribute float aPhase;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.5 + aPhase) * uPixelRatio * (10.0 / -mv.z);
  vColor = uColor;
  vAlpha = uOpacity * (0.6 + 0.4 * sin(uTime * (0.8 + aPhase * 2.0) + aPhase * 50.0));
}
`;
