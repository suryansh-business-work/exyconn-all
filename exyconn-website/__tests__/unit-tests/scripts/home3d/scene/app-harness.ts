/**
 * Starts the home scene loop against a stand-in renderer and scene. Test files using it mock
 * `scene/build` (buildScene) and `scene/frame` (applyFrame) with bare vi.fn()s; the harness
 * gives them their behaviour and records the motion state of every frame drawn.
 */
import { Vector2 } from "three";
import { vi } from "vitest";
import { startScene } from "../../../../../src/scripts/home3d/scene/app";
import { buildScene, type Built } from "../../../../../src/scripts/home3d/scene/build";
import { applyFrame, type Motion } from "../../../../../src/scripts/home3d/scene/frame";
import type { QualityTier } from "../../../../../src/scripts/stage3d/quality";
import {
  installIntersectionObserver,
  stubAnimationFrames,
  type FrameControl,
} from "../../script-dom";
import { tier } from "./scene-fixtures";

export const makeBuilt = () => ({
  renderer: { render: vi.fn(), setSize: vi.fn() },
  scene: { name: "scene" },
  stage: {
    camera: { aspect: 1, fov: 0, updateProjectionMatrix: vi.fn() },
    backdrop: {
      nebula: {
        material: {
          uniforms: { uResolution: { value: new Vector2() }, uScrimSide: { value: new Vector2() } },
        },
      },
    },
  },
  setPixelRatio: vi.fn(),
  dispose: vi.fn(),
});

export type Drawn = Motion & { compact: boolean };

export interface HarnessOptions {
  tier?: Partial<QualityTier>;
  width?: number;
  height?: number;
}

/**
 * Second chapter's top at 2700px in a 1000px viewport: it arrives at scroll offset 2200 and
 * the morph into it runs over the 800px before (1400–2200).
 */
export const SECOND_CHAPTER_TOP = 2700;

export function startHarness(options: HarnessOptions = {}) {
  vi.stubGlobal("innerHeight", 1000);
  vi.stubGlobal("innerWidth", 1000);
  vi.stubGlobal("scrollY", 0);
  vi.spyOn(performance, "now").mockReturnValue(0);
  installIntersectionObserver();
  const frames: FrameControl = stubAnimationFrames();
  const size = { width: options.width ?? 1200, height: options.height ?? 600 };
  const stage = document.createElement("div");
  const host = document.createElement("div");
  Object.defineProperty(host, "clientWidth", { get: () => size.width });
  Object.defineProperty(host, "clientHeight", { get: () => size.height });
  const chapters = [document.createElement("section"), document.createElement("section")];
  vi.spyOn(chapters[1], "getBoundingClientRect").mockReturnValue({
    top: SECOND_CHAPTER_TOP,
  } as DOMRect);
  const built = makeBuilt();
  vi.mocked(buildScene).mockReturnValue(built as unknown as Built);
  const drawn: Drawn[] = [];
  vi.mocked(applyFrame).mockImplementation((_stage, motion, compact) => {
    drawn.push({ ...motion, compact });
  });
  const sceneTier = tier({ pixelRatio: 1.25, minPixelRatio: 1, ...options.tier });
  const stop = startScene({ stage, host, chapters, tier: sceneTier });
  const last = (): Drawn => {
    const frame = drawn.at(-1);
    if (!frame) {
      throw new Error("No frame was drawn");
    }
    return frame;
  };
  return { stage, host, chapters, built, frames, drawn, last, size, sceneTier, stop };
}

export type Harness = ReturnType<typeof startHarness>;

/** Exponential approach over `dt` seconds, as the scene's damp() moves. */
export const eased = (from: number, to: number, lambda: number, dt: number): number =>
  from + (to - from) * (1 - Math.exp(-lambda * dt));
