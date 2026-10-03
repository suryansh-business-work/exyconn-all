import { describe, expect, it } from "vitest";
import {
  FOOTER_COLUMNS,
  HEADER_MENUS,
  LEGAL_LINKS,
  menuIndex,
  MOBILE_SHORTCUTS,
  type NavLink,
} from "../../src/lib/chrome/navigation";
import { ICONS, iconPaths } from "../../src/lib/inner/icons";

const everyLink: NavLink[] = [
  ...HEADER_MENUS.flatMap((group) => [...group.links, ...(group.overview ? [group.overview] : [])]),
  ...FOOTER_COLUMNS.flatMap((column) => column.links),
  ...MOBILE_SHORTCUTS,
  ...LEGAL_LINKS,
];

describe("chrome navigation", () => {
  it("links inside the site unprefixed (the middleware adds the market) and outside in a new tab", () => {
    const wrong = everyLink.filter((link) =>
      link.external ? !link.href.startsWith("https://") : !link.href.startsWith("/")
    );
    expect(wrong).toEqual([]);
  });

  it("never repeats a link within one menu or column", () => {
    for (const group of [...HEADER_MENUS, ...FOOTER_COLUMNS]) {
      const hrefs = group.links.map((link) => link.href);
      expect(new Set(hrefs).size, group.id).toBe(hrefs.length);
    }
  });

  it("gives every menu a unique id, since element ids are built from it", () => {
    const ids = HEADER_MENUS.map((group) => group.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the retired products page out of the chrome", () => {
    expect(everyLink.some((link) => link.href.includes("our-products"))).toBe(false);
  });

  it("pads the menu index to two digits", () => {
    expect(menuIndex(1)).toBe("01");
    expect(menuIndex(11)).toBe("11");
  });
});

describe("icon set", () => {
  it("draws every icon from at least one path", () => {
    const empty = Object.keys(ICONS).filter(
      (name) => iconPaths(name as keyof typeof ICONS).length === 0
    );
    expect(empty).toEqual([]);
  });
});
