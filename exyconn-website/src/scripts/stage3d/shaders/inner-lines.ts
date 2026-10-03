/**
 * The inner stage's structure: building edges, rack frames, chart axes and data links,
 * turning with the protagonist (`uAngle`) and built in the same order (`aOrder`, against
 * `uForm`). A link (`aFlow` = 1) carries bright packets running from its first vertex to its
 * last (`aAlong` 0 → 1). `uLineMix` fades the structure out when the stage morphs to a shape
 * that has none.
 */
export const innerLinesVertex = /* glsl */ `
uniform float uForm;
uniform float uAngle;
uniform float uLineMix;

attribute float aOrder;
attribute float aFlow;
attribute float aAlong;

varying float vBuilt;
varying float vFlow;
varying float vAlong;

void main() {
  float c = cos(uAngle);
  float s = sin(uAngle);
  vec3 p = vec3(c * position.x - s * position.z, position.y, s * position.x + c * position.z);
  vBuilt = smoothstep(0.0, 1.0, clamp((uForm - aOrder * 0.6) / 0.4, 0.0, 1.0)) * uLineMix;
  vFlow = aFlow;
  vAlong = aAlong;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

export const innerLinesFragment = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColA;
uniform vec3 uColB;

varying float vBuilt;
varying float vFlow;
varying float vAlong;

void main() {
  float packet = vFlow * pow(max(0.0, sin((vAlong * 3.0 - uTime * 0.55) * 6.2831853)), 16.0);
  vec3 colour = mix(uColA, uColB, mix(0.3, vAlong, vFlow));
  colour = mix(colour, vec3(1.0), packet * 0.65);
  float base = mix(0.34, 0.2, vFlow);
  gl_FragColor = vec4(colour, (base + packet) * vBuilt * uOpacity);
}
`;
