import { describe, expect, it } from "vitest";
import { ICONS, iconPaths, type IconName } from "../../../../src/lib/inner/icons";

describe("site icon set", () => {
  it("hands out the path list of the named icon", () => {
    expect(iconPaths("menu")).toEqual(["M4 6h16", "M4 12h16", "M4 18h16"]);
    expect(iconPaths("arrow-right")).toBe(ICONS["arrow-right"]);
  });

  it("draws every icon with at least one SVG path command", () => {
    for (const name of Object.keys(ICONS) as IconName[]) {
      const paths = iconPaths(name);
      expect(paths.length).toBeGreaterThan(0);
      for (const d of paths) {
        expect(d).toMatch(/^[Mm][\d.\s,-]/);
      }
    }
  });
});
