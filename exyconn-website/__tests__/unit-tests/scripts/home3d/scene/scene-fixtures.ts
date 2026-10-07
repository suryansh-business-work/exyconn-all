/**
 * A palette and quality tier small enough to build every home-scene object in a test. The
 * colours are distinct per role so a test can tell which role an object was painted with.
 */
import { expect } from "vitest";
import { SRGBColorSpace, type Color, type Vector3 } from "three";
import type { Rgb, ScenePalette } from "../../../../../src/scripts/stage3d/palette";
import type { QualityTier } from "../../../../../src/scripts/stage3d/quality";

export const palette: ScenePalette = {
  deep: [0.02, 0.03, 0.08],
  mid: [0.1, 0.12, 0.3],
  violet: [0.55, 0.36, 0.96],
  fuchsia: [0.85, 0.27, 0.94],
  cyan: [0.13, 0.83, 0.93],
  sky: [0.22, 0.74, 0.97],
  amber: [0.98, 0.75, 0.14],
  orange: [0.98, 0.45, 0.09],
  line: [0.89, 0.91, 0.94],
};

export const tier = (overrides: Partial<QualityTier> = {}): QualityTier => ({
  name: "balanced",
  particles: 400,
  stars: 60,
  filaments: 12,
  ambientPoints: 40,
  nebulaOctaves: 3,
  pixelRatio: 1.25,
  minPixelRatio: 1,
  animate: true,
  ...overrides,
});

export const xyz = (vector: Vector3): number[] => [vector.x, vector.y, vector.z];

/** A three Color read back in the sRGB the page painted it in. */
export const srgbOf = (color: Color): Rgb => {
  const out = { r: 0, g: 0, b: 0 };
  color.getRGB(out, SRGBColorSpace);
  return [out.r, out.g, out.b];
};

/** Every `uniform <type> <name>;` a GLSL source declares. */
export const declaredUniforms = (source: string): string[] =>
  [...source.matchAll(/uniform\s+\w+\s+(\w+);/g)].map((match) => match[1]);

/**
 * Channels equal to `expected` within float rounding. A colour read back through three's
 * sRGB -> linear -> sRGB round trip drifts by about 6e-6, so compare to 4 decimal places.
 */
export const expectRgb = (actual: readonly number[], expected: Rgb): void => {
  expect(actual).toHaveLength(3);
  actual.forEach((channel, index) => expect(channel).toBeCloseTo(expected[index], 4));
};
