/** Detail sections: labelled points, the tabs' keyboard moves and the pager, and glyph scenes. */
import { describe, expect, it } from "vitest";
import { GLYPHS } from "../../../../src/lib/detail/glyphs";
import { splitPoint, tabForKey, tabPosition } from "../../../../src/lib/detail/helpers";
import { sceneWithGlyph } from "../../../../src/lib/detail/scenes";
import type { SceneConfig } from "../../../../src/scripts/stage3d/inner/config";

describe("splitPoint", () => {
  it("splits a capitalised term of up to three words from its text", () => {
    expect(splitPoint("Example: Basic chatbots")).toEqual({
      term: "Example",
      text: "Basic chatbots",
    });
    expect(splitPoint("Real-time data feeds: Live dashboards")).toEqual({
      term: "Real-time data feeds",
      text: "Live dashboards",
    });
  });

  it("leaves lower-case, long or unspaced labels as plain text", () => {
    for (const value of [
      "note: lower case",
      "One two three four: too long",
      "Ratio:no space",
      "Plain sentence",
    ]) {
      expect(splitPoint(value)).toEqual({ text: value });
    }
  });
});

describe("tabForKey", () => {
  it("moves forward and back with wrapping", () => {
    expect(tabForKey("ArrowRight", 0, 3)).toBe(1);
    expect(tabForKey("ArrowDown", 2, 3)).toBe(0);
    expect(tabForKey("ArrowLeft", 0, 3)).toBe(2);
    expect(tabForKey("ArrowUp", 2, 3)).toBe(1);
  });

  it("jumps to the ends and ignores other keys", () => {
    expect(tabForKey("Home", 2, 3)).toBe(0);
    expect(tabForKey("End", 0, 3)).toBe(2);
    expect(tabForKey("Tab", 0, 3)).toBeUndefined();
  });
});

describe("tabPosition", () => {
  it("pads both numbers to two digits", () => {
    expect(tabPosition(3, 9)).toBe("03 / 09");
    expect(tabPosition(12, 120)).toBe("12 / 120");
  });
});

describe("sceneWithGlyph", () => {
  it("adds the named glyph's paths, keeping the scene's other data", () => {
    const scene = sceneWithGlyph({ shapes: ["ops", "glyph"], data: { core: {} } }, "plug");
    expect(scene.shapes).toEqual(["ops", "glyph"]);
    expect(scene.data).toEqual({ core: {}, glyph: { paths: GLYPHS.plug } });
  });

  it("adds data to a scene without any", () => {
    expect(sceneWithGlyph({ shapes: ["glyph"] }, "cog").data).toEqual({
      glyph: { paths: GLYPHS.cog },
    });
  });

  it("returns the scene unchanged for an unknown or inherited name", () => {
    const scene: SceneConfig = { shapes: ["core"] };
    expect(sceneWithGlyph(scene, "")).toBe(scene);
    expect(sceneWithGlyph(scene, "unicorn")).toBe(scene);
    expect(sceneWithGlyph(scene, "constructor")).toBe(scene);
  });
});
