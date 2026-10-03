import { describe, expect, it } from "vitest";
import {
  A11Y_TOGGLE_IDS,
  allCookies,
  backToTopVisible,
  COOKIE_CATEGORIES,
  DEFAULT_FONT,
  FONT_STEPS,
  isFontAction,
  nextFontSize,
  parseA11yPreferences,
} from "../../src/lib/chrome/preferences";

describe("text size steps", () => {
  it("steps up and down the scale and stops at its ends", () => {
    expect(nextFontSize(100, "inc")).toBe(115);
    expect(nextFontSize(100, "dec")).toBe(85);
    expect(nextFontSize(FONT_STEPS.at(-1), "inc")).toBe(FONT_STEPS.at(-1));
    expect(nextFontSize(FONT_STEPS[0], "dec")).toBe(FONT_STEPS[0]);
  });

  it("resets to the default, and treats an unknown size as the default", () => {
    expect(nextFontSize(130, "reset")).toBe(DEFAULT_FONT);
    expect(nextFontSize(undefined, "inc")).toBe(115);
    expect(nextFontSize(42, "dec")).toBe(85);
  });

  it("recognises only the three button actions", () => {
    expect(["inc", "dec", "reset"].every(isFontAction)).toBe(true);
    expect(isFontAction("bigger")).toBe(false);
    expect(isFontAction(undefined)).toBe(false);
  });
});

describe("stored accessibility preferences", () => {
  it("reads an object back", () => {
    expect(parseA11yPreferences('{"links":true,"fontSize":115}')).toEqual({
      links: true,
      fontSize: 115,
    });
  });

  it("treats nothing, junk, arrays and primitives as no preferences", () => {
    for (const raw of [null, "", "{oops", "[1]", "7", "null"]) {
      expect(parseA11yPreferences(raw)).toEqual({});
    }
  });

  it("offers each toggle once", () => {
    expect(new Set(A11Y_TOGGLE_IDS).size).toBe(A11Y_TOGGLE_IDS.length);
  });
});

describe("cookie choices", () => {
  it("sets every optional category for accept all and reject all", () => {
    const ids = COOKIE_CATEGORIES.map((category) => category.id);
    expect(Object.keys(allCookies(true))).toEqual(ids);
    expect(Object.values(allCookies(true)).every(Boolean)).toBe(true);
    expect(Object.values(allCookies(false)).some(Boolean)).toBe(false);
  });
});

describe("back to top", () => {
  it("shows only past the first screen while scrolling up", () => {
    expect(backToTopVisible(3000, 2900, 800)).toBe(true);
    expect(backToTopVisible(2900, 3000, 800)).toBe(false);
    expect(backToTopVisible(900, 700, 800)).toBe(false);
    expect(backToTopVisible(2000, 2000, 800)).toBe(false);
  });
});
