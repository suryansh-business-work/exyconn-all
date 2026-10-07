/** The non-colour tokens: type, icon, space, radius, shadow, motion and stacking. */
import { describe, expect, it } from "vitest";
import { scale } from "../../../../src/styles/tokens/scale.tokens";

const rem = (value: string): number => Number.parseFloat(value.replace("rem", ""));

describe("scale", () => {
  it("orders the sixteen font sizes from smallest to largest", () => {
    const sizes = Object.values(scale["font-size"]).map(rem);
    expect(sizes).toHaveLength(16);
    expect(sizes).toEqual(sizes.toSorted((a, b) => a - b));
    expect(scale["font-size"].md).toBe("1rem");
  });

  it("never draws an icon below 12px", () => {
    const smallest = Math.min(...Object.values(scale["icon-size"]).map(rem));
    expect(smallest * 16).toBeGreaterThanOrEqual(12);
  });

  it("keeps line heights unitless", () => {
    const withUnits = Object.values(scale["line-height"]).filter((v) => !/^\d+(\.\d+)?$/.test(v));
    expect(withUnits).toEqual([]);
  });

  it("keeps every space step on the 0.25rem rhythm", () => {
    const offBeat = Object.entries(scale.space).filter(
      ([step, value]) => rem(value) !== Number(step) * 0.25
    );
    expect(offBeat).toEqual([]);
  });

  it("darkens shadows with a black colour-mix at growing strength", () => {
    expect(scale.shadow.none).toBe("none");
    expect(scale.shadow.xs).toBe(
      "0 1px 3px color-mix(in srgb, var(--palette-base-black) 6%, transparent)"
    );
    expect(scale.shadow.xl).toContain("var(--palette-base-black) 12%");
    expect(scale.shadow.inset.startsWith("inset ")).toBe(true);
    expect(scale.shadow.inset).toContain("10%");
  });

  it("builds the surface transition from three properties on the base timing", () => {
    const parts = scale.transition.surface.split(", ");
    expect(parts).toEqual([
      "background-color var(--duration-base) var(--ease-standard)",
      "border-color var(--duration-base) var(--ease-standard)",
      "box-shadow var(--duration-base) var(--ease-standard)",
    ]);
    expect(scale.transition.color).toBe("color var(--duration-base) var(--ease-standard)");
  });

  it("puts the skip link above every other layer", () => {
    const layers = Object.values(scale.z).map(Number);
    expect(Number(scale.z["skip-link"])).toBe(Math.max(...layers));
    expect(Number(scale.z.modal)).toBeGreaterThan(Number(scale.z.overlay));
  });

  it("makes the pill radius round at any height", () => {
    expect(scale.radius.pill).toBe("9999px");
    expect(scale.radius.circle).toBe("50%");
  });
});
