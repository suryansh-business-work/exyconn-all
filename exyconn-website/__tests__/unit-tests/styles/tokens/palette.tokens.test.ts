/** The colour ramps, the hue list and the `ramp()` helper every role is built from. */
import { describe, expect, it } from "vitest";
import { HUES, palette, ramp } from "../../../../src/styles/tokens/palette.tokens";

describe("palette", () => {
  it("keeps pure white and black on the base ramp", () => {
    expect(palette.base).toEqual({ white: "#ffffff", black: "#000000" });
  });

  it("runs the brand blue from 300 to 700 around the Exyconn 500", () => {
    expect(Object.keys(palette.brand)).toEqual(["300", "500", "600", "700"]);
    expect(palette.brand[500]).toBe("#0071e3");
  });

  it("gives every hue the full 50–950 ramp", () => {
    const steps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
    const incomplete = HUES.filter((hue) => Object.keys(palette[hue]).join() !== steps.join());
    expect(incomplete).toEqual([]);
  });

  it("lists seventeen distinct hues, all present in the palette", () => {
    expect(HUES).toHaveLength(17);
    expect(new Set(HUES).size).toBe(HUES.length);
    expect(HUES.filter((hue) => !(hue in palette))).toEqual([]);
  });

  it("leaves the neutral and night families out of the hue roles", () => {
    const hues: ReadonlySet<string> = new Set(HUES);
    expect(["base", "brand", "ink", "slate", "gray"].filter((f) => hues.has(f))).toEqual([]);
  });
});

describe("ramp", () => {
  it("names a numeric step as a palette custom property", () => {
    expect(ramp("blue", 600)).toBe("var(--palette-blue-600)");
  });

  it("names a keyword step the same way", () => {
    expect(ramp("base", "white")).toBe("var(--palette-base-white)");
    expect(ramp("base", "black")).toBe("var(--palette-base-black)");
  });

  it("reaches the brand and ink families", () => {
    expect(ramp("brand", 300)).toBe("var(--palette-brand-300)");
    expect(ramp("ink", 950)).toBe("var(--palette-ink-950)");
  });
});
