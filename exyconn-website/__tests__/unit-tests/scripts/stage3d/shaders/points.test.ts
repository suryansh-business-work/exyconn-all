/** The glow sprite shared by stars and the inner protagonist, and the simple star vertex. */
import { describe, expect, it } from "vitest";
import {
  glowFragment,
  simplePointsVertex,
} from "../../../../../src/scripts/stage3d/shaders/points";
import { attributesOf, hasMain, uniformsOf, varyingsOf } from "./glsl";

describe("glowFragment", () => {
  it("reads the colour and alpha every points vertex shader writes", () => {
    expect(hasMain(glowFragment)).toBe(true);
    expect(varyingsOf(glowFragment)).toEqual(["vColor", "vAlpha"]);
    expect(uniformsOf(glowFragment)).toEqual([]);
  });

  it("draws a round sprite, discarding the corners of the point quad", () => {
    expect(glowFragment).toContain("gl_PointCoord");
    expect(glowFragment).toMatch(/if \(d > 1\.0\) discard;/);
    expect(glowFragment).toContain("gl_FragColor = vec4(vColor, glow * vAlpha)");
  });
});

describe("simplePointsVertex", () => {
  it("declares the uniforms glowPointsMaterial binds and the per-point phase", () => {
    expect(hasMain(simplePointsVertex)).toBe(true);
    expect(uniformsOf(simplePointsVertex)).toEqual([
      "uTime",
      "uSize",
      "uPixelRatio",
      "uOpacity",
      "uColor",
    ]);
    expect(attributesOf(simplePointsVertex)).toEqual(["aPhase"]);
  });

  it("writes the varyings the glow fragment reads, sized by distance", () => {
    expect(varyingsOf(simplePointsVertex)).toEqual(varyingsOf(glowFragment));
    expect(simplePointsVertex).toContain("gl_PointSize");
    expect(simplePointsVertex).toContain("(10.0 / -mv.z)");
  });
});
