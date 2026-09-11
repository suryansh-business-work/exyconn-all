import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { brandFallback } from "../src/styles/tokens/brand.tokens";
import { palette } from "../src/styles/tokens/palette.tokens";
import {
  darkRoles,
  highContrastRoles,
  lightRoles,
  roles,
} from "../src/styles/tokens/semantic.tokens";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));
const TOKENS_DIR = "styles/tokens/";

/** Every stylable source file outside the tokens folder, as [relative path, contents]. */
const sources: [string, string][] = readdirSync(SRC, { recursive: true, encoding: "utf8" })
  .filter((file) => /\.(astro|tsx?|jsx|s?css)$/.test(file) && !file.startsWith(TOKENS_DIR))
  .map((file) => [file, readFileSync(SRC + file, "utf8")]);

const findAll = (pattern: RegExp, pick = 0): string[] =>
  sources.flatMap(([file, text]) => [...text.matchAll(pattern)].map((m) => `${file}: ${m[pick]}`));

const paletteVars = new Set(
  Object.entries(palette).flatMap(([family, steps]) =>
    Object.keys(steps).map((step) => `palette-${family}-${step}`)
  )
);
const roleNames = new Set(Object.keys(roles));

describe("palette", () => {
  it("holds only hex or oklch values", () => {
    const values = Object.values(palette).flatMap((steps) => Object.values(steps));
    expect(values.filter((v) => !/^(#[0-9a-f]{6}|oklch\([^)]+\))$/.test(v))).toEqual([]);
  });

  it("never repeats a value under two names", () => {
    const values = Object.values(palette).flatMap((steps) => Object.values(steps));
    expect(values.length).toBe(new Set(values).size);
  });

  it("gives the browser chrome a literal brand colour", () => {
    expect(brandFallback.primary).toBe(palette.brand[500]);
  });
});

describe("semantic roles", () => {
  const answers = [
    ...Object.values(lightRoles),
    ...Object.values(darkRoles),
    ...Object.values(highContrastRoles),
  ];

  it("paint only from the ramps and from other roles", () => {
    const literal = answers.filter((value) =>
      /#[0-9a-f]{3,8}\b|oklch\(|rgba?\(|hsla?\(/i.test(value)
    );
    expect(literal).toEqual([]);
  });

  it("reference only ramps and roles that exist", () => {
    const refs = answers.flatMap((value) =>
      [...value.matchAll(/var\(--([\w-]+)\)/g)].map((m) => m[1])
    );
    const missing = refs.filter(
      (ref) => !paletteVars.has(ref) && !roleNames.has(ref.replace(/^color-/, ""))
    );
    expect(missing).toEqual([]);
  });

  it("answer every night override with a role that exists by day", () => {
    expect(Object.keys(darkRoles).filter((role) => !(role in lightRoles))).toEqual([]);
  });
});

describe("components paint only with roles", () => {
  const PALETTE_CLASS =
    /(?<![\w-])(?:[\w-]+:)*!?(?:bg|text|border(?:-[trblxy])?|from|via|to|ring|fill|stroke|shadow|divide|outline|placeholder|decoration|accent|caret)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?![\w-])/g;

  /**
   * Tailwind's own palette is switched off in global.css, so a raw `text-gray-600` silently
   * renders as inherited ink — in daylight it can look fine, at night it is wrong.
   */
  it("writes no raw Tailwind palette classes", () => {
    expect(findAll(PALETTE_CLASS)).toEqual([]);
  });

  it("never reaches past the roles into a ramp", () => {
    expect(findAll(/var\(--palette-[\w-]+\)/g)).toEqual([]);
  });

  it("writes no colour literals", () => {
    const literals =
      /(?<![\w&-])(?:#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})|%23[0-9a-f]{3,8}|(?:rgba?|hsla?|oklch)\()(?![\w-])/gi;
    expect(findAll(literals)).toEqual([]);
  });

  it("names only roles that exist, in utilities and in var()", () => {
    const utility =
      /(?<![\w-])(?:[\w-]+:)*!?(?:bg|text|border|from|via|to|ring|fill|stroke|shadow|divide|placeholder)-((?:page|surface|inverse|fg|line|on-solid|on-primary|scrim|primary|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-[a-z]+)*)(?:\/[\d.]+)?(?![\w-])/g;
    const unknownUtilities = findAll(utility, 1).filter(
      (hit) => !roleNames.has(hit.split(": ")[1])
    );
    const unknownVars = findAll(/var\(--color-([\w-]+)\)/g, 1).filter(
      (hit) => !roleNames.has(hit.split(": ")[1])
    );
    expect([...unknownUtilities, ...unknownVars]).toEqual([]);
  });
});
