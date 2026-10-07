/** The fonts a design system loads: one Google Fonts link and @font-face rules for uploads. */
import { describe, expect, it } from "vitest";
import { customFontCss, googleFontsHref } from "../../../../src/lib/cms/fonts";
import type { CmsFontFile, CmsFontSource } from "../../../../src/lib/cms/types";

const google = (family: string, variants: string[]): CmsFontSource => ({
  family,
  provider: "GOOGLE",
  variants,
});
const custom = (family: string, files: CmsFontFile[]): CmsFontSource => ({
  family,
  provider: "CUSTOM",
  files,
});
const file = (overrides: Partial<CmsFontFile> = {}): CmsFontFile => ({
  url: "https://cdn.test/brand.woff2",
  weight: "400",
  style: "normal",
  format: "woff2",
  ...overrides,
});

describe("googleFontsHref", () => {
  it("is empty without tokens or Google families", () => {
    expect(googleFontsHref(undefined)).toBe("");
    expect(googleFontsHref({})).toBe("");
    expect(googleFontsHref({ fontSources: [custom("Brand", [file()])] })).toBe("");
  });

  it("asks for every Google family's styles, upright first then by weight", () => {
    const href = googleFontsHref({
      fontSources: [google("Inter Tight", ["700", "400i", "400", "bold"]), google("Lora", [])],
    });
    expect(href).toBe(
      "https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,400;0,700;1,400&family=Lora&display=swap"
    );
  });

  it("skips a family whose name could break the URL", () => {
    expect(googleFontsHref({ fontSources: [google("Bad<Font>", ["400"])] })).toBe("");
    expect(googleFontsHref({ fontSources: [google(" Lead", ["400"])] })).toBe("");
  });

  it("encodes non-ASCII family names", () => {
    expect(googleFontsHref({ fontSources: [google("Noto Sans Él", [])] })).toBe(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+%C3%89l&display=swap"
    );
  });
});

describe("customFontCss", () => {
  it("is empty without tokens or uploaded families", () => {
    expect(customFontCss(undefined)).toBe("");
    expect(customFontCss({ fontSources: [google("Inter", ["400"])] })).toBe("");
  });

  it("writes one @font-face per file", () => {
    const css = customFontCss({
      fontSources: [
        custom("Brand", [file(), file({ weight: "700", style: "italic", format: "woff" })]),
      ],
    });
    expect(css.split("\n")).toEqual([
      '@font-face{font-family:"Brand";src:url("https://cdn.test/brand.woff2") format("woff2");font-weight:400;font-style:normal;font-display:swap;}',
      '@font-face{font-family:"Brand";src:url("https://cdn.test/brand.woff2") format("woff");font-weight:700;font-style:italic;font-display:swap;}',
    ]);
  });

  it("drops files with an unsafe URL or weight", () => {
    const css = customFontCss({
      fontSources: [
        custom("Brand", [
          file({ url: "http://cdn.test/a.woff2" }),
          file({ url: 'https://cdn.test/a".woff2' }),
          file({ weight: "450" }),
          file({ weight: "bold" }),
        ]),
      ],
    });
    expect(css).toBe("");
  });

  it("skips a family with an unsafe name", () => {
    expect(customFontCss({ fontSources: [custom("x{}", [file()])] })).toBe("");
  });

  it("keeps a family named with an apostrophe", () => {
    expect(customFontCss({ fontSources: [custom("Brand's Sans", [file()])] })).toContain(
      `font-family:"Brand's Sans"`
    );
  });
});
