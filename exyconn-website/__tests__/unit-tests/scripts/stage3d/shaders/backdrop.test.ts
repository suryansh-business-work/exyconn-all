/** The nebula backdrop, the floor grid and the radar plate shaders. */
import { describe, expect, it } from "vitest";
import {
  backdropFragment,
  backdropVertex,
  gridFragment,
  gridVertex,
  radarFragment,
  uvVertex,
} from "../../../../../src/scripts/stage3d/shaders/backdrop";
import { hasMain, uniformsOf, varyingsOf } from "./glsl";

describe("backdrop shaders", () => {
  it("draws a full-screen quad at the far plane", () => {
    expect(hasMain(backdropVertex)).toBe(true);
    expect(backdropVertex).toContain("gl_Position = vec4(position.xy, 0.9999, 1.0)");
    expect(varyingsOf(backdropVertex)).toEqual([]);
  });

  it("declares every uniform the inner nebula material sets", () => {
    expect(hasMain(backdropFragment)).toBe(true);
    expect(uniformsOf(backdropFragment)).toEqual([
      "uResolution",
      "uTime",
      "uScroll",
      "uFocus",
      "uTintAmount",
      "uDeep",
      "uMid",
      "uGlowA",
      "uGlowB",
      "uTint",
      "uScrimSide",
    ]);
  });

  it("leaves the octave count to the quality tier's define", () => {
    expect(backdropFragment).toContain("i < OCTAVES");
    expect(backdropFragment).not.toMatch(/#define\s+OCTAVES/);
  });

  it("sinks the reading side back towards the night with an opaque result", () => {
    expect(backdropFragment).toContain("mix(color, uDeep, scrim * 0.7)");
    expect(backdropFragment).toContain("gl_FragColor = vec4(color, 1.0)");
  });
});

describe("grid shaders", () => {
  it("pass the world position from vertex to fragment", () => {
    expect(hasMain(gridVertex)).toBe(true);
    expect(hasMain(gridFragment)).toBe(true);
    expect(varyingsOf(gridVertex)).toEqual(["vWorld"]);
    expect(varyingsOf(gridFragment)).toEqual(varyingsOf(gridVertex));
    expect(uniformsOf(gridFragment)).toEqual(["uColor", "uOpacity", "uTime"]);
  });

  it("guards the derivative so grazing angles never paint NaN", () => {
    expect(gridFragment).toContain("max(fwidth(g), vec2(0.0001))");
  });
});

describe("radar shaders", () => {
  it("share the uv varying and clip the plate to a disc", () => {
    expect(hasMain(uvVertex)).toBe(true);
    expect(hasMain(radarFragment)).toBe(true);
    expect(varyingsOf(uvVertex)).toEqual(["vUv"]);
    expect(varyingsOf(radarFragment)).toEqual(varyingsOf(uvVertex));
    expect(uniformsOf(radarFragment)).toEqual(["uColor", "uOpacity", "uTime"]);
    expect(radarFragment).toContain("if (r > 1.0) discard;");
  });
});
