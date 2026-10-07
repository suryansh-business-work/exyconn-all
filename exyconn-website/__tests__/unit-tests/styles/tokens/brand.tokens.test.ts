/** The literal brand colours used where a CSS variable cannot reach. */
import { describe, expect, it } from "vitest";
import { brandFallback } from "../../../../src/styles/tokens/brand.tokens";
import { palette } from "../../../../src/styles/tokens/palette.tokens";

describe("brandFallback", () => {
  it("reads every colour straight from the palette", () => {
    expect(brandFallback).toEqual({
      primary: palette.brand[500],
      secondary: palette.purple[600],
      accent: palette.cyan[500],
      background: palette.base.white,
      text: palette.gray[900],
    });
  });

  it("is a literal value, not a variable reference", () => {
    const refs = Object.values(brandFallback).filter((value) => value.startsWith("var("));
    expect(refs).toEqual([]);
    expect(brandFallback.primary).toBe("#0071e3");
    expect(brandFallback.background).toBe("#ffffff");
  });
});
