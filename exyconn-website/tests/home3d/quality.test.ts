import { describe, expect, it } from "vitest";
import {
  adaptPixelRatio,
  selectQualityTier,
  SLOW_FRAME_MS,
  type DeviceProfile,
} from "../../src/scripts/home3d/quality";

const desktop: DeviceProfile = {
  width: 1440,
  devicePixelRatio: 2,
  cores: 8,
  memoryGb: 8,
  reducedMotion: false,
};

describe("selectQualityTier", () => {
  it("gives a capable laptop the balanced tier with a capped pixel ratio", () => {
    const tier = selectQualityTier(desktop);
    expect(tier.name).toBe("balanced");
    expect(tier.pixelRatio).toBe(1.25);
    expect(tier.particles).toBeGreaterThanOrEqual(16000);
    expect(tier.animate).toBe(true);
  });

  it("gives a wide, strong desktop the high tier at 1.5x at most", () => {
    const tier = selectQualityTier({ ...desktop, width: 1920 });
    expect(tier.name).toBe("high");
    expect(tier.particles).toBe(24000);
    expect(tier.pixelRatio).toBe(1.5);
  });

  it("keeps weak desktops balanced even when wide", () => {
    expect(selectQualityTier({ ...desktop, width: 1920, cores: 4 }).name).toBe("balanced");
    expect(selectQualityTier({ ...desktop, width: 1920, memoryGb: 2 }).name).toBe("balanced");
    expect(selectQualityTier({ ...desktop, width: 1920, memoryGb: undefined }).name).toBe(
      "balanced"
    );
  });

  it("simplifies phones: fewer points, no filaments, pixel ratio at most 1.25", () => {
    const tier = selectQualityTier({ ...desktop, width: 390, devicePixelRatio: 3 });
    expect(tier.name).toBe("mobile");
    expect(tier.particles).toBeLessThanOrEqual(7000);
    expect(tier.filaments).toBe(0);
    expect(tier.pixelRatio).toBe(1.25);
  });

  it("drops weak or unknown phones to the low tier", () => {
    const tier = selectQualityTier({ width: 360, devicePixelRatio: 2, reducedMotion: false });
    expect(tier.name).toBe("low");
    expect(tier.particles).toBe(5000);
    expect(tier.pixelRatio).toBe(1);
  });

  it("never raises the pixel ratio above the device's own", () => {
    expect(selectQualityTier({ ...desktop, devicePixelRatio: 1 }).pixelRatio).toBe(1);
  });

  it("stops animating under reduced motion", () => {
    expect(selectQualityTier({ ...desktop, reducedMotion: true }).animate).toBe(false);
  });
});

describe("adaptPixelRatio", () => {
  it("keeps the ratio while frames are quick", () => {
    expect(adaptPixelRatio(SLOW_FRAME_MS - 1, 1.5, 1)).toBe(1.5);
  });

  it("steps down a quarter when frames run long, but not below the floor", () => {
    expect(adaptPixelRatio(40, 1.5, 1)).toBe(1.25);
    expect(adaptPixelRatio(40, 1, 1)).toBe(1);
  });
});
