/** The accessibility and cookie drawers' pure rules. */
import { describe, expect, it } from "vitest";
import {
  A11Y_STORAGE_KEY,
  A11Y_TOGGLE_IDS,
  A11Y_TOGGLES,
  allCookies,
  backToTopVisible,
  CONSENT_STORAGE_KEY,
  COOKIE_CATEGORIES,
  COOKIE_PREFS_STORAGE_KEY,
  DEFAULT_FONT,
  FONT_STEPS,
  isFontAction,
  nextFontSize,
  parseA11yPreferences,
} from "../../../../src/lib/chrome/preferences";

describe("storage keys", () => {
  it("keeps the keys the a11y audit seeds", () => {
    expect([A11Y_STORAGE_KEY, CONSENT_STORAGE_KEY, COOKIE_PREFS_STORAGE_KEY]).toEqual([
      "a11yPreferences",
      "cookieConsent",
      "cookiePreferences",
    ]);
  });
});

describe("nextFontSize", () => {
  it("moves one step up or down from a known size", () => {
    expect(nextFontSize(115, "inc")).toBe(130);
    expect(nextFontSize(115, "dec")).toBe(100);
  });

  it("stops at both ends of the scale", () => {
    expect(nextFontSize(150, "inc")).toBe(150);
    expect(nextFontSize(85, "dec")).toBe(85);
  });

  it("counts an unknown or missing size as the default", () => {
    expect(nextFontSize(undefined, "inc")).toBe(115);
    expect(nextFontSize(999, "dec")).toBe(85);
  });

  it("resets to the default from anywhere", () => {
    expect(nextFontSize(150, "reset")).toBe(DEFAULT_FONT);
    expect(nextFontSize(undefined, "reset")).toBe(DEFAULT_FONT);
    expect(FONT_STEPS).toContain(DEFAULT_FONT);
  });
});

describe("isFontAction", () => {
  it("accepts only inc, dec and reset", () => {
    expect(isFontAction("inc")).toBe(true);
    expect(isFontAction("dec")).toBe(true);
    expect(isFontAction("reset")).toBe(true);
    expect(isFontAction("INC")).toBe(false);
    expect(isFontAction(null)).toBe(false);
    expect(isFontAction(1)).toBe(false);
  });
});

describe("parseA11yPreferences", () => {
  it("reads stored toggles and the text size", () => {
    expect(parseA11yPreferences('{"contrast":true,"fontSize":130}')).toEqual({
      contrast: true,
      fontSize: 130,
    });
  });

  it("treats empty, malformed, array, primitive and null JSON as no preferences", () => {
    for (const raw of [null, "", "{nope", "[true]", "42", '"text"', "null"]) {
      expect(parseA11yPreferences(raw)).toEqual({});
    }
  });
});

describe("toggles and cookies", () => {
  it("derives the toggle ids from the toggles, once each", () => {
    expect(A11Y_TOGGLE_IDS).toEqual(A11Y_TOGGLES.map((toggle) => toggle.id));
    expect(new Set(A11Y_TOGGLE_IDS).size).toBe(A11Y_TOGGLE_IDS.length);
  });

  it("sets every cookie category to one value", () => {
    expect(allCookies(true)).toEqual({ analytics: true, functional: true, marketing: true });
    expect(allCookies(false)).toEqual({ analytics: false, functional: false, marketing: false });
    expect(Object.keys(allCookies(true))).toEqual(COOKIE_CATEGORIES.map((c) => c.id));
  });

  it("leaves marketing off until the visitor opts in", () => {
    const initial = Object.fromEntries(COOKIE_CATEGORIES.map((c) => [c.id, c.initial]));
    expect(initial).toEqual({ analytics: true, functional: true, marketing: false });
  });
});

describe("backToTopVisible", () => {
  it("shows past the first screen only while scrolling up", () => {
    expect(backToTopVisible(2000, 1500, 800)).toBe(true);
    expect(backToTopVisible(1500, 2000, 800)).toBe(false);
  });

  it("hides within the first screen and when not moving", () => {
    expect(backToTopVisible(900, 800, 800)).toBe(false);
    expect(backToTopVisible(1500, 1500, 800)).toBe(false);
  });
});
