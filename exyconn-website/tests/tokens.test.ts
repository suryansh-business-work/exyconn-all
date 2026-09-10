import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { brandFallback } from "../src/styles/tokens/brand.tokens";

const read = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

const RAMPS = read("../src/styles/tokens/colors.tokens.scss");

/** Every `--palette-*` declaration in the ramp file, as name -> hex. */
const palette = new Map<string, string>(
  [...RAMPS.matchAll(/--(palette-[\w-]+):\s*(#[0-9a-f]{6});/g)].map((m) => [m[1], m[2]])
);

describe("colour ramps", () => {
  it("defines every shade as a six-digit lowercase hex", () => {
    expect(palette.size).toBeGreaterThan(50);
  });

  it("never repeats a value under two names", () => {
    const byHex = new Map<string, string>();
    const duplicates: string[] = [];
    for (const [name, hex] of palette) {
      const first = byHex.get(hex);
      if (first) {
        duplicates.push(`${hex} is both ${first} and ${name}`);
      }
      byHex.set(hex, name);
    }
    expect(duplicates).toEqual([]);
  });
});

describe("brand fallback", () => {
  /**
   * The TS copy exists only for `<meta name="theme-color">` and friends, which cannot read
   * a CSS variable. If it drifts from the ramp, the browser chrome and the page stop
   * agreeing on what the brand blue is — a difference nobody sees until it ships.
   */
  it.each([
    ["primary", "palette-brand-500"],
    ["secondary", "palette-purple-500"],
    ["accent", "palette-cyan-500"],
    ["background", "palette-neutral-0"],
    ["text", "palette-gray-900"],
  ] as const)("keeps %s equal to its ramp entry", (role, token) => {
    expect(brandFallback[role]).toBe(palette.get(token));
  });
});

describe("mode parity", () => {
  const light = read("../src/styles/tokens/modes/light.token.scss");
  const dark = read("../src/styles/tokens/modes/dark.token.scss");
  const rolesIn = (css: string, block: RegExp): Set<string> => {
    const body = block.exec(css)?.[1] ?? "";
    return new Set([...body.matchAll(/--(color-[\w-]+|focus-ring-color):/g)].map((m) => m[1]));
  };

  /**
   * A role answered in one mode and missing in the other is how a screen ends up designed
   * in daylight and discovered at night.
   */
  it("answers the same roles in light and dark", () => {
    const inLight = rolesIn(light, /^:root \{([\s\S]*?)^\}/m);
    const inDark = rolesIn(dark, /^\.dark \{([\s\S]*?)^\}/m);
    expect([...inLight].filter((role) => !inDark.has(role))).toEqual([]);
    expect([...inDark].filter((role) => !inLight.has(role))).toEqual([]);
  });

  it("paints both modes only from the ramps", () => {
    for (const css of [light, dark]) {
      expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });
});
