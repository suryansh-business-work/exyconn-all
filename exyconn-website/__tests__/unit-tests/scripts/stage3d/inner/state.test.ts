/** The inner stage's pure decisions, at their boundaries. */
import { describe, expect, it } from "vitest";
import {
  approach,
  formAmount,
  FORM_SECONDS,
  HIGHLIGHT_SECONDS,
  idleMotion,
  LIVE_RATIO,
  needsFrames,
  parseHighlight,
  parseShapeIndex,
  phaseFor,
} from "../../../../../src/scripts/stage3d/inner/state";

describe("phaseFor", () => {
  it("is live from exactly the live ratio up, whatever the echoes do", () => {
    expect(phaseFor(LIVE_RATIO, false)).toBe("live");
    expect(phaseFor(1, true)).toBe("live");
  });

  it("prefers an echo over dimming just below the live ratio", () => {
    expect(phaseFor(LIVE_RATIO - 0.01, true)).toBe("echo");
    expect(phaseFor(0, true)).toBe("echo");
  });

  it("dims while any of the hero shows and parks once it is gone", () => {
    expect(phaseFor(0.01, false)).toBe("dimmed");
    expect(phaseFor(0, false)).toBe("parked");
  });
});

describe("formAmount", () => {
  it("never leaves 0 to 1, even before the form began", () => {
    expect(formAmount(-1)).toBe(0);
    expect(formAmount(FORM_SECONDS)).toBe(1);
    expect(formAmount(FORM_SECONDS / 4)).toBeCloseTo(0.25);
  });
});

describe("parseHighlight", () => {
  it("reads tag 0 and integer prefixes, and treats null or text as none", () => {
    expect(parseHighlight("0")).toBe(0);
    expect(parseHighlight("4px")).toBe(4);
    expect(parseHighlight(null)).toBe(-1);
    expect(parseHighlight("card")).toBe(-1);
  });
});

describe("parseShapeIndex", () => {
  it("falls back to the hero shape for text and clamps negatives to it", () => {
    expect(parseShapeIndex("echo", 3)).toBe(0);
    expect(parseShapeIndex(undefined, 3)).toBe(0);
    expect(parseShapeIndex("-2", 3)).toBe(0);
  });

  it("keeps an index within the scene's shapes", () => {
    expect(parseShapeIndex("2", 3)).toBe(2);
    expect(parseShapeIndex("5", 3)).toBe(2);
  });
});

describe("needsFrames", () => {
  it("runs a dimmed scene only while something settles", () => {
    expect(needsFrames("dimmed", true, true)).toBe(true);
    expect(needsFrames("dimmed", true, false)).toBe(false);
  });

  it("never runs a parked scene or any scene without animation", () => {
    expect(needsFrames("parked", true, false)).toBe(false);
    expect(needsFrames("echo", false, true)).toBe(false);
    expect(needsFrames("dimmed", false, true)).toBe(false);
  });
});

describe("approach", () => {
  it("stays put once at the goal", () => {
    expect(approach(0.5, 0.5, 0.2)).toBe(0.5);
  });

  it("covers a highlight's whole travel in its duration", () => {
    expect(approach(0, 1, (HIGHLIGHT_SECONDS * 0.5) / HIGHLIGHT_SECONDS)).toBeCloseTo(0.5);
    expect(approach(0, 1, 1)).toBe(1);
  });
});

describe("idleMotion", () => {
  it("spins volumes without sway and sways flat layouts without spin", () => {
    expect(idleMotion("spin")).toEqual({ spin: 0.1, sway: 0 });
    expect(idleMotion("sway")).toEqual({ spin: 0, sway: 0.3 });
  });
});
