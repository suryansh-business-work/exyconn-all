// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { startHarness, type Harness } from "./app-harness";

vi.mock("../../../../../src/scripts/home3d/scene/build", () => ({ buildScene: vi.fn() }));
vi.mock("../../../../../src/scripts/home3d/scene/frame", () => ({ applyFrame: vi.fn() }));

let h: Harness | undefined;

/** Runs `count` frames, each `stepMs` after the one before. */
const runFrames = (harness: Harness, count: number, stepMs: number, from = 0): number => {
  let now = from;
  for (let i = 0; i < count; i += 1) {
    now += stepMs;
    harness.frames.flush(now);
  }
  return now;
};

afterEach(() => {
  h?.stop();
  h = undefined;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("startScene adaptive resolution", () => {
  it("drops a step of resolution after 90 slow frames that follow the warm-up", () => {
    h = startHarness({ tier: { pixelRatio: 1.25, minPixelRatio: 1 } });
    const now = runFrames(h, 149, 30);
    expect(h.built.setPixelRatio).not.toHaveBeenCalled();

    runFrames(h, 1, 30, now);
    expect(h.built.setPixelRatio).toHaveBeenCalledWith(1);
    expect(h.built.renderer.setSize).toHaveBeenCalledTimes(2);
    expect(h.built.stage.backdrop.nebula.material.uniforms.uResolution.value.toArray()).toEqual([
      1200, 600,
    ]);
  });

  it("never goes below the tier's floor and stops measuring after two samples", () => {
    h = startHarness({ tier: { pixelRatio: 1.25, minPixelRatio: 1 } });
    runFrames(h, 400, 30);
    expect(h.built.setPixelRatio).toHaveBeenCalledTimes(1);
  });

  it("keeps the resolution while frames are quick", () => {
    h = startHarness({ tier: { pixelRatio: 1.5, minPixelRatio: 1 } });
    runFrames(h, 300, 16);
    expect(h.built.setPixelRatio).not.toHaveBeenCalled();
    expect(h.built.renderer.setSize).toHaveBeenCalledTimes(1);
  });

  it("measures each sample afresh, so a slow warm-up does not count", () => {
    h = startHarness({ tier: { pixelRatio: 1.5, minPixelRatio: 1 } });
    const afterWarmUp = runFrames(h, 60, 50);
    const afterFirst = runFrames(h, 90, 16, afterWarmUp);
    expect(h.built.setPixelRatio).not.toHaveBeenCalled();
    runFrames(h, 90, 40, afterFirst);
    expect(h.built.setPixelRatio).toHaveBeenCalledWith(1.25);
  });
});
