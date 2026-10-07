/** The colour roles, answered once for daylight and once for night. */
import { describe, expect, it } from "vitest";
import { HUES } from "../../../../src/styles/tokens/palette.tokens";
import {
  darkRoles,
  highContrastRoles,
  lightRoles,
  readableInk,
  roleVar,
  roles,
} from "../../../../src/styles/tokens/semantic.tokens";

const HUE_SUFFIXES = [
  "-subtle",
  "-soft",
  "-muted",
  "",
  "-strong",
  "-deep",
  "-night",
  "-bright",
  "-fg",
  "-fg-strong",
  "-fg-deep",
];

describe("roleVar and readableInk", () => {
  it("names a role as its custom property", () => {
    expect(roleVar("surface")).toBe("var(--color-surface)");
  });

  it("pulls an admin colour 40% towards the foreground ink", () => {
    expect(readableInk("#123456")).toBe("color-mix(in oklab, #123456 60%, var(--color-fg))");
  });
});

describe("neutral and brand roles", () => {
  it("answers the page white by day and ink 900 at night", () => {
    expect(roles.page).toEqual(["var(--palette-base-white)", "var(--palette-ink-900)"]);
  });

  it("places fg-subtle halfway between gray 500 and 600 by day", () => {
    expect(lightRoles["fg-subtle"]).toBe(
      "color-mix(in oklab, var(--palette-gray-500), var(--palette-gray-600))"
    );
    expect(roles["field-border"][0]).toBe(
      "color-mix(in oklab, var(--palette-gray-400), var(--palette-gray-500))"
    );
  });

  it("lets faint ink and placeholders answer with fg-subtle in both modes", () => {
    expect(roles["fg-faint"]).toEqual(["var(--color-fg-subtle)", "var(--color-fg-subtle)"]);
    expect(roles["fg-placeholder"]).toEqual(["var(--color-fg-subtle)", "var(--color-fg-subtle)"]);
  });

  it("thins the brand blue towards transparent for the tint roles", () => {
    expect(roles["primary-faint"][0]).toBe(
      "color-mix(in srgb, var(--palette-brand-500) 4%, transparent)"
    );
    expect(roles["primary-subtle"][1]).toContain("12.5%");
    expect(roles["primary-soft"][1]).toContain("25%");
  });

  it("steps primary up to brand 300 at night", () => {
    expect(roles.primary).toEqual(["var(--palette-brand-500)", "var(--palette-brand-300)"]);
  });
});

describe("hue roles", () => {
  it("gives every hue all eleven roles", () => {
    const missing = HUES.flatMap((hue) =>
      HUE_SUFFIXES.map((suffix) => `${hue}${suffix}`).filter((role) => !(role in roles))
    );
    expect(missing).toEqual([]);
  });

  it("tints the night washes into the night page", () => {
    expect(roles["red-subtle"]).toEqual([
      "var(--palette-red-50)",
      "color-mix(in oklab, var(--palette-red-500) 10%, var(--palette-ink-900))",
    ]);
    expect(roles["red-soft"][1]).toContain("18%");
    expect(roles["red-muted"][1]).toContain("30%");
  });

  it("keeps solid fills the same in both modes", () => {
    expect(roles.blue).toEqual(["var(--palette-blue-500)", "var(--palette-blue-500)"]);
    expect(roles["teal-night"]).toEqual(["var(--palette-teal-950)", "var(--palette-teal-950)"]);
  });

  it("starts most hues' daylight text at 700 and their strong text at 800", () => {
    expect(roles["blue-fg"]).toEqual(["var(--palette-blue-700)", "var(--palette-blue-400)"]);
    expect(roles["blue-fg-strong"]).toEqual(["var(--palette-blue-800)", "var(--palette-blue-300)"]);
  });

  it("takes yellow and green ink one step deeper", () => {
    expect(roles["yellow-fg"][0]).toBe("var(--palette-yellow-800)");
    expect(roles["green-fg-strong"][0]).toBe("var(--palette-green-900)");
    expect(roles["green-fg-deep"]).toEqual([
      "var(--palette-green-900)",
      "var(--palette-green-200)",
    ]);
  });
});

describe("mode maps", () => {
  it("answers every role by day", () => {
    expect(Object.keys(lightRoles)).toEqual(Object.keys(roles));
    expect(lightRoles.fg).toBe("var(--palette-gray-900)");
  });

  it("overrides at night only the roles whose answer changes", () => {
    expect(darkRoles.fg).toBe("var(--palette-gray-50)");
    expect("on-solid" in darkRoles).toBe(false);
    expect("blue" in darkRoles).toBe(false);
    const unchanged = Object.entries(darkRoles).filter(([role, dark]) => lightRoles[role] === dark);
    expect(unchanged).toEqual([]);
  });

  it("darkens primary and muted ink for high contrast", () => {
    expect(highContrastRoles).toEqual({
      primary: "var(--palette-brand-600)",
      "fg-muted": "var(--palette-gray-700)",
    });
  });
});
