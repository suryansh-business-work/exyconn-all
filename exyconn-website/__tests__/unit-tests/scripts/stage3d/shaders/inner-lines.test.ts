/** The inner stage's structure lines: vertex and fragment agree, and match the material. */
import { describe, expect, it } from "vitest";
import {
  innerLinesFragment,
  innerLinesVertex,
} from "../../../../../src/scripts/stage3d/shaders/inner-lines";
import { attributesOf, hasMain, uniformsOf, varyingsOf } from "./glsl";

describe("inner lines shaders", () => {
  it("turns and builds the lines with the protagonist", () => {
    expect(hasMain(innerLinesVertex)).toBe(true);
    expect(uniformsOf(innerLinesVertex)).toEqual(["uForm", "uAngle", "uLineMix"]);
    expect(attributesOf(innerLinesVertex)).toEqual(["aOrder", "aFlow", "aAlong"]);
    expect(innerLinesVertex).toContain("cos(uAngle)");
    expect(innerLinesVertex).toContain("(uForm - aOrder * 0.6) / 0.4");
    expect(innerLinesVertex).toContain("* uLineMix");
  });

  it("colours the lines from the accent pair with packets on data links", () => {
    expect(hasMain(innerLinesFragment)).toBe(true);
    expect(uniformsOf(innerLinesFragment)).toEqual(["uTime", "uOpacity", "uColA", "uColB"]);
    expect(innerLinesFragment).toContain("float packet = vFlow *");
    expect(innerLinesFragment).toContain("* vBuilt * uOpacity");
  });

  it("shares its varyings between the two stages", () => {
    expect(varyingsOf(innerLinesVertex)).toEqual(["vBuilt", "vFlow", "vAlong"]);
    expect(varyingsOf(innerLinesFragment)).toEqual(varyingsOf(innerLinesVertex));
  });

  it("binds every uniform the structure material sets across the pair", () => {
    const declared = new Set([...uniformsOf(innerLinesVertex), ...uniformsOf(innerLinesFragment)]);
    const bound = ["uTime", "uForm", "uAngle", "uLineMix", "uOpacity", "uColA", "uColB"];
    expect(bound.filter((name) => !declared.has(name))).toEqual([]);
    expect(declared.size).toBe(bound.length);
  });
});
