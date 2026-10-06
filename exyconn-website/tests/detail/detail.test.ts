import { describe, expect, it } from "vitest";
import { arc, circle, gear, GLYPHS, roundedRect } from "../../src/lib/detail/glyphs";
import { splitPoint, tabForKey, tabPosition } from "../../src/lib/detail/helpers";
import { sceneWithGlyph } from "../../src/lib/detail/scenes";
import { sampleGlyph } from "../../src/scripts/stage3d/shapes/glyph";
import { createRandom } from "../../src/scripts/stage3d/math";

describe("helpers", () => {
  it("splits labelled points and leaves plain ones", () => {
    expect(splitPoint("Example: Basic chatbots")).toEqual({
      term: "Example",
      text: "Basic chatbots",
    });
    expect(splitPoint("Handles text, images: and code")).toEqual({
      text: "Handles text, images: and code",
    });
  });

  it("moves between tabs with the WAI-ARIA keys", () => {
    expect(tabForKey("ArrowRight", 23, 24)).toBe(0);
    expect(tabForKey("ArrowDown", 0, 24)).toBe(1);
    expect(tabForKey("ArrowLeft", 0, 24)).toBe(23);
    expect(tabForKey("ArrowUp", 2, 24)).toBe(1);
    expect(tabForKey("Home", 5, 24)).toBe(0);
    expect(tabForKey("End", 5, 24)).toBe(23);
    expect(tabForKey("Enter", 5, 24)).toBeUndefined();
  });
});

describe("tab pager and scenes", () => {
  it("formats the pager's position", () => {
    expect(tabPosition(3, 24)).toBe("03 / 24");
  });

  it("builds a scene that re-forms into a named glyph", () => {
    const scene = sceneWithGlyph({ shapes: ["ops", "glyph"] }, "cog");
    expect(scene.shapes[0]).toBe("ops");
    expect(scene.data?.glyph?.paths).toBe(GLYPHS.cog);
    expect(sceneWithGlyph({ shapes: ["core"] }, "")).toEqual({ shapes: ["core"] });
  });
});

describe("glyphs", () => {
  const inBounds = (path: readonly (readonly [number, number])[]) =>
    path.every(([x, y]) => Math.abs(x) <= 1 && Math.abs(y) <= 1);

  it("draws arcs, circles, rounded boxes and cogs as closed or open polylines", () => {
    expect(arc(0, 0, 1, 0, Math.PI, 2)).toEqual([
      [1, 0],
      [0, 1],
      [-1, 0],
    ]);
    const ring = circle(0, 0, 0.5);
    expect(ring[0]).toEqual(ring.at(-1));
    const box = roundedRect(-1, -1, 1, 1, 0.2);
    expect(box[0]).toEqual(box.at(-1));
    expect(inBounds(box)).toBe(true);
    const cog = gear(0, 0, 0.9, 0.7, 8);
    expect(cog).toHaveLength(8 * 4 + 1);
  });

  it("keeps every glyph inside the unit square and samples it", () => {
    Object.values(GLYPHS).forEach((paths) => {
      paths.forEach((path) => {
        expect(path.length).toBeGreaterThanOrEqual(2);
        expect(inBounds(path)).toBe(true);
      });
      const cloud = sampleGlyph(200, createRandom(1), { paths });
      expect(cloud.positions).toHaveLength(600);
    });
  });
});
