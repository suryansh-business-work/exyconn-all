/**
 * The protagonist. Every point carries its position in all four worlds; the vertex shader
 * animates each world (core spin, streaming contrails, the arm and conveyor, the orbiting
 * system) and blends the two neighbouring worlds of the current story position. Points
 * leave at staggered times and arc out through a scatter, so a morph reads as a swarm
 * re-forming rather than a cross-fade.
 */
export const particleVertex = /* glsl */ `
uniform float uTime;
uniform float uStory;
uniform float uScatter;
uniform float uSize;
uniform float uPixelRatio;
uniform float uBlueprint;
uniform float uOpacity;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec3 uColC;
uniform vec3 uColLine;
uniform vec3 uTint;
uniform vec3 uShoulder;
uniform vec3 uElbow;
uniform vec2 uArm;
uniform mat3 uTilt;
uniform vec2 uBelt;
uniform vec3 uTrail;

attribute vec3 aJet;
attribute vec3 aRobot;
attribute vec3 aPlanet;
attribute vec4 aAnim;

varying vec3 vColor;
varying float vAlpha;

const float PI = 3.141592653589793;
float gFade = 1.0;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

vec2 rotate2(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

vec3 aroundZ(vec3 p, vec3 pivot, float a) {
  vec3 q = p - pivot;
  q.xy = rotate2(q.xy, a);
  return q + pivot;
}

vec3 corePos() {
  vec3 p = position;
  p.xz = rotate2(p.xz, uTime * 0.12);
  return p;
}

vec3 jetPos() {
  vec3 p = aJet;
  if (aAnim.x > 0.5) {
    float top = aAnim.x > 1.5 ? uTrail.z : uTrail.y;
    p.x = top - mod(top - p.x + uTime * 1.6, top - uTrail.x);
    gFade = smoothstep(uTrail.x, uTrail.x + 3.0, p.x);
  }
  return p;
}

vec3 robotPos() {
  vec3 p = aRobot;
  if (aAnim.y > 2.5) {
    p.x = uBelt.x + mod(p.x - uBelt.x + uTime * 0.45, uBelt.y - uBelt.x);
    return p;
  }
  if (aAnim.y > 1.5) {
    p = aroundZ(p, uElbow, uArm.y);
  }
  if (aAnim.y > 0.5) {
    p = aroundZ(p, uShoulder, uArm.x);
  }
  return p;
}

vec3 planetPos() {
  vec3 p = aPlanet;
  p.xz = rotate2(p.xz, uTime * aAnim.z);
  return uTilt * p;
}

vec3 shapeAt(float index) {
  if (index < 0.5) return corePos();
  if (index < 1.5) return jetPos();
  if (index < 2.5) return robotPos();
  if (index < 3.5) return planetPos();
  return corePos();
}

void main() {
  float r = aAnim.w;
  float story = clamp(uStory, 0.0, 4.0);
  float index = min(floor(story), 3.0);
  float t = smoothstep(0.0, 1.0, clamp((story - index - r * 0.3) / 0.7, 0.0, 1.0));
  vec3 dir = normalize(vec3(hash(r * 91.7), hash(r * 53.3 + 1.0), hash(r * 17.9 + 2.0)) - 0.5 + 0.0001);
  vec3 p = mix(shapeAt(index), shapeAt(index + 1.0), t);
  p += dir * (sin(t * PI) * uScatter + sin(uTime * 1.3 + r * 40.0) * 0.012);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float hot = step(0.965, hash(r * 3.7));
  float size = uSize * (0.55 + 0.9 * hash(r * 7.1)) * (1.0 + hot * 1.2) * mix(1.0, 0.6, uBlueprint);
  gl_PointSize = size * uPixelRatio * (10.0 / -mv.z);

  vec3 color = mix(uColA, uColB, smoothstep(0.0, 0.55, r));
  color = mix(color, uColC, smoothstep(0.6, 1.0, r));
  color = mix(color, uTint, 0.35);
  color = mix(color, vec3(1.0), hot * 0.55);
  vColor = mix(color, uColLine, uBlueprint * 0.85);

  float twinkle = 0.78 + 0.22 * sin(uTime * 2.0 + r * 60.0);
  vAlpha = uOpacity * gFade * twinkle * mix(0.85, 0.55, uBlueprint) * (0.7 + 0.3 * hot);
}
`;

/** A soft round sprite with a hot centre: additive blending turns overlaps into glow. */
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
