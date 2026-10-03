/**
 * The inner-page protagonist. Every point carries its position in up to three shapes and
 * a tag per shape. `uForm` gathers the swarm out of a scatter when the hero opens; `uShape`
 * morphs between shapes (0 → 1 → 2) with a staggered swarm, as on the home page; and
 * `uHighlight` lights the points whose tag matches (−1 = none) while the rest recede.
 */
export const innerParticleVertex = /* glsl */ `
uniform float uTime;
uniform float uShape;
uniform float uForm;
uniform float uAngle;
uniform float uSize;
uniform float uPixelRatio;
uniform float uOpacity;
uniform float uHighlight;
uniform float uHighlightMix;
uniform vec3 uColA;
uniform vec3 uColB;

attribute vec3 aShape1;
attribute vec3 aShape2;
attribute vec3 aTags;
attribute float aRandom;

varying vec3 vColor;
varying float vAlpha;

const float PI = 3.141592653589793;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

vec3 shapeAt(float index) {
  vec3 p = index < 0.5 ? position : (index < 1.5 ? aShape1 : aShape2);
  float a = uAngle;
  float c = cos(a);
  float s = sin(a);
  return vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z);
}

float tagAt(float index) {
  return index < 0.5 ? aTags.x : (index < 1.5 ? aTags.y : aTags.z);
}

void main() {
  float r = aRandom;
  float shape = clamp(uShape, 0.0, 2.0);
  float index = min(floor(shape), 1.0);
  float t = smoothstep(0.0, 1.0, clamp((shape - index - r * 0.3) / 0.7, 0.0, 1.0));
  vec3 dir = normalize(vec3(hash(r * 91.7), hash(r * 53.3 + 1.0), hash(r * 17.9 + 2.0)) - 0.5 + 0.0001);
  vec3 p = mix(shapeAt(index), shapeAt(index + 1.0), t);
  p += dir * (sin(t * PI) * 0.8 + sin(uTime * 1.3 + r * 40.0) * 0.012);
  float form = smoothstep(0.0, 1.0, clamp((uForm - r * 0.35) / 0.65, 0.0, 1.0));
  p = mix(dir * (3.2 + r * 2.5), p, form);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float tag = t < 0.5 ? tagAt(index) : tagAt(index + 1.0);
  float highlightOn = step(0.0, uHighlight) * uHighlightMix;
  float lit = highlightOn * (1.0 - step(0.5, abs(tag - uHighlight)));
  float hot = step(0.965, hash(r * 3.7));
  float size = uSize * (0.55 + 0.9 * hash(r * 7.1)) * (1.0 + hot * 1.2) * (1.0 + lit * 0.8);
  gl_PointSize = size * uPixelRatio * (10.0 / -mv.z);

  vec3 color = mix(uColA, uColB, smoothstep(0.15, 0.85, r));
  vColor = mix(color, vec3(1.0), hot * 0.5 + lit * 0.35);
  float twinkle = 0.78 + 0.22 * sin(uTime * 2.0 + r * 60.0);
  float recede = mix(1.0, 0.3, highlightOn - lit);
  vAlpha = uOpacity * twinkle * 0.85 * recede * (0.3 + 0.7 * form) * (0.7 + 0.3 * hot);
}
`;
