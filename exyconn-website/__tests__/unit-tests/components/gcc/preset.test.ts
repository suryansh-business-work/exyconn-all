/**
 * The GCC calculator's seeded preset (the 'gcc.calculator' catalogue default): it must pass the
 * calculator's own schema, and every scenario must compute without a missing exchange rate.
 */
import { describe, expect, it } from "vitest";
import { cmsComponent } from "@exyconn/cms";
import { calculateScenario, calculatorPresetSchema } from "@exyconn/gcc-cost";

const defaults = cmsComponent("gcc.calculator")?.defaultProps;
const parsed = calculatorPresetSchema.safeParse(defaults?.preset);

describe("gcc.calculator default preset", () => {
  it("passes calculatorPresetSchema", () => {
    expect(parsed.error?.issues ?? []).toEqual([]);
    expect(parsed.success).toBe(true);
  });

  it("offers the lean, standard and enterprise scenarios, in that order", () => {
    expect(parsed.data?.scenarios.map((scenario) => scenario.id)).toEqual([
      "lean",
      "standard",
      "enterprise",
    ]);
  });

  it("invents no exchange rate and prices Claude models from the cited list", () => {
    expect(parsed.data?.fxRates).toEqual([]);
    for (const entry of parsed.data?.pricing ?? []) {
      expect(entry.source.kind).toBe("verified");
      expect(entry.source.url).toMatch(/^https:\/\//);
    }
  });

  it.each(parsed.data?.scenarios.map((scenario) => [scenario.id, scenario] as const) ?? [])(
    "computes the %s scenario without issues",
    (_id, scenario) => {
      const result = calculateScenario(scenario, parsed.data?.fxRates ?? []);
      expect(result.issues).toEqual([]);
      expect(result.months.some((month) => month.total > 0)).toBe(true);
    }
  );
});
