import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { HUES } from "../src/styles/tokens/palette.tokens";
import { darkRoles, lightRoles } from "../src/styles/tokens/semantic.tokens";
import { composite, contrastRatio, resolveColor } from "./support/color";

/**
 * WCAG 2.2 AA contrast for the colour roles, measured in both modes: 4.5:1 for text
 * (1.4.3), 3:1 for the parts of a control a person must see to use it (1.4.11).
 */
const TEXT = 4.5;
const NON_TEXT = 3;

const MODES = {
  light: (role: string) => lightRoles[role],
  dark: (role: string) => darkRoles[role] ?? lightRoles[role],
} as const;
type Mode = keyof typeof MODES;

/** The ratio of `fg` painted on `bg`, with `bg` itself painted on the page. */
function ratio(mode: Mode, fg: string, bg: string): number {
  const lookup = MODES[mode];
  const page = resolveColor(lookup("page"), lookup);
  const ground = composite(resolveColor(lookup(bg), lookup), page);
  return contrastRatio(composite(resolveColor(lookup(fg), lookup), ground), ground);
}

function failures(pairs: readonly (readonly [string, string, number])[]): string[] {
  return (Object.keys(MODES) as Mode[]).flatMap((mode) =>
    pairs
      .map(([fg, bg, minimum]) => ({ fg, bg, minimum, value: ratio(mode, fg, bg) }))
      .filter(({ value, minimum }) => value < minimum)
      .map(({ fg, bg, value }) => `${mode}: ${fg} on ${bg} = ${value.toFixed(2)}`)
  );
}

const SURFACES = ["page", "surface", "surface-subtle", "surface-muted"];
const NEUTRAL_INKS = ["fg", "fg-secondary", "fg-muted", "fg-subtle", "fg-faint"];
/** Large text (the form headings) and non-text (focus borders, a checked box): 3:1. */
const BRAND_INKS = ["primary", "primary-hover"];

describe("text contrast", () => {
  it("keeps every neutral and brand ink readable on every page surface", () => {
    const pairs = [
      ...NEUTRAL_INKS.flatMap((fg) => SURFACES.map((bg) => [fg, bg, TEXT] as const)),
      ...BRAND_INKS.flatMap((fg) => SURFACES.map((bg) => [fg, bg, NON_TEXT] as const)),
    ];
    expect(failures(pairs)).toEqual([]);
  });

  it("keeps every hue ink readable on the page surfaces and on its own tints", () => {
    const pairs = HUES.flatMap((hue) =>
      [`${hue}-fg`, `${hue}-fg-strong`, `${hue}-fg-deep`].flatMap((fg) =>
        [...SURFACES, `${hue}-subtle`, `${hue}-soft`].map((bg) => [fg, bg, TEXT] as const)
      )
    );
    expect(failures(pairs)).toEqual([]);
  });

  it("keeps white readable on the solid fills that carry it", () => {
    const fills = [
      "inverse",
      "inverse-muted",
      ...HUES.flatMap((hue) => [`${hue}-deep`, `${hue}-night`]),
    ];
    const pairs = [
      ...fills.map((bg) => ["on-solid", bg, TEXT] as const),
      ["on-solid-muted", "inverse", TEXT],
      ["on-primary", "primary", TEXT],
      ["button-fg", "button-bg", TEXT],
      ["fg-placeholder", "field-bg", TEXT],
      ...HUES.map((hue) => [`${hue}-bright`, "inverse", TEXT] as const),
    ] as const;
    expect(failures(pairs)).toEqual([]);
  });
});

describe("non-text contrast", () => {
  it("draws the focus ring and field borders visibly against the page", () => {
    const pairs = [
      ["focus-ring", "page", NON_TEXT],
      ["focus-ring", "surface", NON_TEXT],
      ["field-border", "field-bg", NON_TEXT],
      ["field-border", "surface-subtle", NON_TEXT],
    ] as const;
    expect(failures(pairs)).toEqual([]);
  });
});

/**
 * Pairs a component actually writes on one element — `bg-blue-soft text-blue-fg` — read
 * from the source, so a new combination is measured the day it is written.
 */
describe("pairs written in components", () => {
  const SRC = fileURLToPath(new URL("../src/", import.meta.url));
  const CLASS_ATTR = /class(?:Name)?=["'`{]([^"'`}]*)["'`}]/g;
  /* A background, or any stop of a gradient: text has to be readable across all of it. */
  const BG = /(?<![\w:-])(?:bg|from|via|to)-([a-z]+(?:-[a-z]+)*)(?![\w/-])/g;
  const TEXT_ROLE = /(?<![\w:-])text-([a-z]+(?:-[a-z]+)*)(?![\w/-])/g;
  const roles = new Set(Object.keys(lightRoles));

  const written = new Set<string>();
  /* Gradient-clipped headings: every stop is the ink, on the page it sits on. */
  const clipped = new Set<string>();
  readdirSync(SRC, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.(astro|tsx?|jsx)$/.test(file))
    .forEach((file) => {
      for (const [, classes] of readFileSync(SRC + file, "utf8").matchAll(CLASS_ATTR)) {
        if (classes.includes("bg-clip-text")) {
          for (const [, stop] of classes.matchAll(BG)) {
            if (roles.has(stop)) {
              clipped.add(stop);
            }
          }
        }
        const fg = [...classes.matchAll(TEXT_ROLE)]
          .map((m) => m[1])
          .find((name) => roles.has(name));
        if (!fg) {
          continue;
        }
        for (const [, bg] of classes.matchAll(BG)) {
          if (roles.has(bg)) {
            written.add(`${fg}|${bg}`);
          }
        }
      }
    });

  it("finds pairs to measure", () => {
    expect(written.size).toBeGreaterThan(10);
  });

  it("keeps gradient headings at 3:1, the large-text minimum, at every stop", () => {
    const pairs = [...clipped].map((stop) => [stop, "page", NON_TEXT] as const);
    expect(failures(pairs)).toEqual([]);
  });

  it("keeps each of them at 4.5:1 in both modes", () => {
    const pairs = [...written].map((pair) => {
      const [fg, bg] = pair.split("|");
      return [fg, bg, TEXT] as const;
    });
    expect(failures(pairs)).toEqual([]);
  });
});
