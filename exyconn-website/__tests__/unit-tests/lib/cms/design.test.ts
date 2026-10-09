/** A site's design system written as CSS custom properties, and author CSS kept in its <style>. */
import { describe, expect, it } from "vitest";
import { designSystemCss, safeCss } from "../../../../src/lib/cms/design";
import type { CmsDesignSystem, CmsDesignTokens } from "../../../../src/lib/cms/types";

const design = (tokens: CmsDesignTokens, extraCss = ""): CmsDesignSystem => ({
  id: "ds1",
  tokens,
  extraCss,
});

describe("safeCss", () => {
  it("escapes every closing style tag, in any case", () => {
    expect(safeCss("a{}</style><script>x</STYLE>")).toBe(
      String.raw`a{}<\/style><script>x<\/style>`
    );
  });

  it("leaves ordinary CSS alone", () => {
    expect(safeCss(".a{color:red}")).toBe(".a{color:red}");
  });
});

describe("designSystemCss", () => {
  it("writes nothing without a design system", () => {
    expect(designSystemCss(null)).toBe("");
  });

  it("writes light colours and every token group on :root and dark colours under the theme", () => {
    const css = designSystemCss(
      design({
        palette: { "brand-500": "#7c3aed" },
        colors: { light: { surface: "#fff" }, dark: { surface: "#000" } },
        fonts: { sans: "Inter, sans-serif" },
        radii: { md: "8px" },
        shadows: { sm: "0 1px 2px rgb(0 0 0 / 10%)" },
        spacing: { "4": "1rem" },
      })
    );
    expect(css.split("\n")).toEqual([
      ":root{--color-surface:#fff;--palette-brand-500:#7c3aed;--font-family-sans:Inter, sans-serif;--radius-md:8px;--shadow-sm:0 1px 2px rgb(0 0 0 / 10%);--space-4:1rem;}",
      '[data-theme="dark"]{--color-surface:#000;}',
    ]);
  });

  it("drops names and values that could break out of the rule", () => {
    const css = designSystemCss(
      design({
        colors: {
          light: {
            ok: "red",
            "bad name": "blue",
            "-lead": "blue",
            inject: "red;}body{x:y",
            tag: "<b>",
            empty: "",
          },
        },
      })
    );
    expect(css).toBe(":root{--color-ok:red;}");
  });

  it("omits an empty side and still appends the extra CSS, escaped", () => {
    const escapedExtra = String.raw`p{}<\/style>`;
    expect(designSystemCss(design({ colors: { dark: { ink: "#eee" } } }, "p{}</style>"))).toBe(
      `[data-theme="dark"]{--color-ink:#eee;}\n${escapedExtra}`
    );
    expect(designSystemCss(design({}, ".x{}"))).toBe(".x{}");
    expect(designSystemCss(design({}))).toBe("");
  });

  it("refuses a value over 300 characters", () => {
    expect(designSystemCss(design({ radii: { big: "1".repeat(301) } }))).toBe("");
    expect(designSystemCss(design({ radii: { big: "1".repeat(300) } }))).toContain("--radius-big");
  });
});
