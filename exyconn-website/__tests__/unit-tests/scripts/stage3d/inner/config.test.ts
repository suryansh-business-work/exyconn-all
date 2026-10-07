/** The inner stage's scene config: defaults from the page family and the JSON guard. */
import { describe, expect, it } from "vitest";
import {
  ACCENT_HUES,
  FAMILY_ACCENTS,
  parseScene,
  resolveScene,
  type PageFamily,
} from "../../../../../src/scripts/stage3d/inner/config";
import { MAX_STAGE_SHAPES } from "../../../../../src/scripts/stage3d/shapes/targets";

const valid = { shapes: ["globe"], accent: ["violet", "amber"] };
const parseWith = (patch: Record<string, unknown>) =>
  parseScene(JSON.stringify({ ...valid, ...patch }));

describe("FAMILY_ACCENTS", () => {
  it("gives every family a pair of known hues", () => {
    const hues = new Set<string>(ACCENT_HUES);
    Object.values(FAMILY_ACCENTS).forEach((pair) => {
      expect(pair).toHaveLength(2);
      expect(pair.every((hue) => hues.has(hue))).toBe(true);
    });
  });
});

describe("resolveScene", () => {
  it.each(Object.keys(FAMILY_ACCENTS) as PageFamily[])(
    "falls back to the %s family's pair",
    (family) => {
      expect(resolveScene({ shapes: ["core"] }, family).accent).toEqual(FAMILY_ACCENTS[family]);
    }
  );

  it("copies the shape list so the scene cannot change the page's config", () => {
    const shapes = ["city", "globe"] as const;
    const resolved = resolveScene({ shapes, data: { globe: {} }, seed: 9 }, "proof");
    expect(resolved.shapes).toEqual(["city", "globe"]);
    expect(resolved.shapes).not.toBe(shapes);
    expect(resolved.data).toEqual({ globe: {} });
    expect(resolved.seed).toBe(9);
  });
});

describe("parseScene", () => {
  it("accepts up to the stage's shape limit", () => {
    const shapes = ["core", "globe", "city"].slice(0, MAX_STAGE_SHAPES);
    expect(parseWith({ shapes }).shapes).toEqual(shapes);
  });

  it("drops data that is not an object and a seed that is not a number", () => {
    const parsed = parseWith({ data: "lots", seed: "7" });
    expect(parsed.data).toEqual({});
    expect(parsed.seed).toBeUndefined();
  });

  it("keeps an object of shape data and a numeric seed of zero", () => {
    const parsed = parseWith({ data: { cubes: { cubes: 2 } }, seed: 0 });
    expect(parsed.data).toEqual({ cubes: { cubes: 2 } });
    expect(parsed.seed).toBe(0);
  });

  it("rejects a missing accent and an accent of three hues", () => {
    expect(() => parseScene(JSON.stringify({ shapes: ["globe"] }))).toThrow(
      "scene config needs an accent pair"
    );
    expect(() => parseWith({ accent: ["violet", "amber", "cyan"] })).toThrow(/accent pair/);
  });

  it("rejects a list mixing a known id with a non-string", () => {
    expect(() => parseWith({ shapes: ["globe", 4] })).toThrow(
      `scene config needs 1 to ${MAX_STAGE_SHAPES} known shape ids`
    );
  });

  it("surfaces malformed JSON as a syntax error", () => {
    expect(() => parseScene("")).toThrow(SyntaxError);
    expect(() => parseScene("{shapes:")).toThrow(SyntaxError);
  });

  it("rejects an array, which is an object but carries no fields", () => {
    expect(() => parseScene("[]")).toThrow(/shape ids/);
  });
});
