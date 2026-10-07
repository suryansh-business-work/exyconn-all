/** The inner protagonist's vertex shader: its contract with the material built in scene.ts. */
import { describe, expect, it } from "vitest";
import { innerParticleVertex } from "../../../../../src/scripts/stage3d/shaders/inner-particles";
import { glowFragment } from "../../../../../src/scripts/stage3d/shaders/points";
import { attributesOf, hasMain, uniformsOf, varyingsOf } from "./glsl";

describe("innerParticleVertex", () => {
  it("declares every uniform the protagonist material sets", () => {
    expect(hasMain(innerParticleVertex)).toBe(true);
    expect(uniformsOf(innerParticleVertex)).toEqual([
      "uTime",
      "uShape",
      "uForm",
      "uAngle",
      "uSize",
      "uPixelRatio",
      "uOpacity",
      "uHighlight",
      "uHighlightMix",
      "uColA",
      "uColB",
      "uPointer",
      "uPointerMix",
      "uAspect",
    ]);
  });

  it("reads the extra shapes, packed tags, random and build order per point", () => {
    expect(attributesOf(innerParticleVertex)).toEqual([
      "aShape1",
      "aShape2",
      "aTags",
      "aRandom",
      "aOrder",
    ]);
  });

  it("feeds the glow fragment its colour and alpha", () => {
    expect(varyingsOf(innerParticleVertex)).toEqual(varyingsOf(glowFragment));
  });

  it("picks shapes and tags by index and lights only the matching tag", () => {
    expect(innerParticleVertex).toContain("index < 0.5 ? position");
    expect(innerParticleVertex).toContain("index < 0.5 ? aTags.x");
    expect(innerParticleVertex).toContain("step(0.0, uHighlight) * uHighlightMix");
    expect(innerParticleVertex).toContain("abs(tag - uHighlight)");
  });

  it("gathers the swarm by build order and pushes points away from the pointer", () => {
    expect(innerParticleVertex).toContain("(uForm - aOrder * 0.6) / 0.4");
    expect(innerParticleVertex).toContain("clip.xy / clip.w - uPointer");
    expect(innerParticleVertex).toContain("uPointerMix * smoothstep");
  });
});
