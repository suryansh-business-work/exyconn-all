import { describe, expect, it } from "vitest";
import { FAMILY_ACCENTS, parseScene, resolveScene } from "../../src/scripts/stage3d/inner/config";
import {
  approach,
  formAmount,
  FORM_SECONDS,
  needsFrames,
  parseHighlight,
  parseShapeIndex,
  phaseFor,
} from "../../src/scripts/stage3d/inner/state";
import {
  selectInnerTier,
  selectQualityTier,
  wantsStaticScene,
  type DeviceProfile,
} from "../../src/scripts/stage3d/quality";

const desktop: DeviceProfile = {
  width: 1440,
  devicePixelRatio: 2,
  cores: 8,
  memoryGb: 8,
  reducedMotion: false,
};
const phone: DeviceProfile = { ...desktop, width: 390, devicePixelRatio: 3 };

describe("inner quality tier", () => {
  it("keeps the home point budget and caps the pixel ratio at 1.5 on desktops", () => {
    const tier = selectInnerTier(desktop);
    expect(tier.particles).toBe(selectQualityTier(desktop).particles);
    expect(tier.particles).toBe(16000);
    expect(tier.pixelRatio).toBe(1.5);
    expect(tier.nebulaOctaves).toBe(2);
    expect(tier.ambientPoints).toBe(0);
  });

  it("gives phones 7k points, DPR 1.25 and no nebula", () => {
    const tier = selectInnerTier(phone);
    expect(tier.particles).toBe(7000);
    expect(tier.pixelRatio).toBe(1.25);
    expect(tier.nebulaOctaves).toBe(0);
    expect(selectInnerTier({ ...phone, reducedMotion: true }).animate).toBe(false);
  });

  it("keeps the static gradient for Save-Data and small-memory devices", () => {
    expect(wantsStaticScene(desktop, true)).toBe(true);
    expect(wantsStaticScene({ ...desktop, memoryGb: 2 }, false)).toBe(true);
    expect(wantsStaticScene({ ...desktop, memoryGb: undefined }, false)).toBe(false);
    expect(wantsStaticScene(desktop, false)).toBe(false);
  });
});

describe("scene config", () => {
  it("fills the family accent pair unless the page names one", () => {
    expect(resolveScene({ shapes: ["globe"] }, "company")).toEqual({
      shapes: ["globe"],
      data: {},
      accent: FAMILY_ACCENTS.company,
      seed: undefined,
    });
    expect(
      resolveScene({ shapes: ["rings"], accent: ["sky", "amber"], seed: 4 }, "ai").accent
    ).toEqual(["sky", "amber"]);
  });

  it("parses what the stage carries and rejects what it could not draw", () => {
    const good = { shapes: ["cubes"], data: { cubes: { cubes: 3 } }, accent: ["cyan", "amber"] };
    expect(parseScene(JSON.stringify(good))).toEqual({ ...good, seed: undefined });
    expect(parseScene(JSON.stringify({ ...good, data: null, seed: 7 }))).toEqual({
      ...good,
      data: {},
      seed: 7,
    });
    expect(() => parseScene("3")).toThrow(/object/);
    expect(() => parseScene("null")).toThrow(/object/);
    expect(() => parseScene(JSON.stringify({ ...good, shapes: [] }))).toThrow(/shape ids/);
    expect(() => parseScene(JSON.stringify({ ...good, shapes: "cubes" }))).toThrow(/shape ids/);
    expect(() => parseScene(JSON.stringify({ ...good, shapes: ["teapot"] }))).toThrow(/shape/);
    expect(() =>
      parseScene(JSON.stringify({ ...good, shapes: ["core", "core", "core", "core"] }))
    ).toThrow(/shape ids/);
    expect(() => parseScene(JSON.stringify({ ...good, accent: ["cyan"] }))).toThrow(/accent/);
    expect(() => parseScene(JSON.stringify({ ...good, accent: ["red", "cyan"] }))).toThrow(
      /accent/
    );
    expect(() => parseScene(JSON.stringify({ ...good, accent: "cyan" }))).toThrow(/accent/);
  });
});

describe("stage state", () => {
  it("is live while most of the hero shows, then echoes, dims or parks", () => {
    expect(phaseFor(0.8, true)).toBe("live");
    expect(phaseFor(0.2, true)).toBe("echo");
    expect(phaseFor(0.2, false)).toBe("dimmed");
    expect(phaseFor(0, false)).toBe("parked");
  });

  it("gathers the swarm over the form time", () => {
    expect(formAmount(0)).toBe(0);
    expect(formAmount(FORM_SECONDS / 2)).toBeCloseTo(0.5);
    expect(formAmount(FORM_SECONDS * 3)).toBe(1);
  });

  it("reads highlight tags and shape indices from attributes", () => {
    expect(parseHighlight("2")).toBe(2);
    expect(parseHighlight("")).toBe(-1);
    expect(parseHighlight(undefined)).toBe(-1);
    expect(parseHighlight("-3")).toBe(-1);
    expect(parseShapeIndex("1", 3)).toBe(1);
    expect(parseShapeIndex("9", 2)).toBe(1);
    expect(parseShapeIndex(null, 2)).toBe(0);
  });

  it("runs frames only while live or settling, never under reduced motion", () => {
    expect(needsFrames("live", true, false)).toBe(true);
    expect(needsFrames("echo", true, true)).toBe(true);
    expect(needsFrames("echo", true, false)).toBe(false);
    expect(needsFrames("parked", true, true)).toBe(false);
    expect(needsFrames("live", false, true)).toBe(false);
  });

  it("approaches a goal without passing it", () => {
    expect(approach(0, 1, 0.3)).toBeCloseTo(0.3);
    expect(approach(0.9, 1, 0.3)).toBe(1);
    expect(approach(1, 0, 0.4)).toBeCloseTo(0.6);
    expect(approach(0.1, 0, 0.4)).toBe(0);
  });
});
