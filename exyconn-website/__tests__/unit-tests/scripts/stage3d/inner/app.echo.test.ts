// @vitest-environment jsdom
/** The inner scene beyond the hero: echo hosts, highlights and resizing. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { highlightStage } from "../../../../../src/scripts/stage3d/events";
import { startInnerScene } from "../../../../../src/scripts/stage3d/inner/app";
import type { ResolvedScene } from "../../../../../src/scripts/stage3d/inner/config";
import { buildInnerWorld } from "../../../../../src/scripts/stage3d/inner/scene";
import {
  flushFrame,
  installBrowser,
  makeTier,
  makeWorld,
  observers,
  pendingFrames,
  setSize,
} from "./app.fixture";

vi.mock("../../../../../src/scripts/stage3d/inner/scene", () => ({ buildInnerWorld: vi.fn() }));

const config: ResolvedScene = { shapes: ["city", "globe"], data: {}, accent: ["sky", "violet"] };

let stage: HTMLElement;
let host: HTMLElement;
let band: HTMLElement;
const running: Array<() => void> = [];

const start = async (animate: boolean, echoes: readonly HTMLElement[] = [band]) => {
  const made = makeWorld();
  vi.mocked(buildInnerWorld).mockReturnValue(made.world);
  const stop = await startInnerScene({ stage, host, echoes, config, tier: makeTier(animate) });
  running.push(stop);
  return { ...made, stop };
};

const heroGone = () => observers().hero.fire([{ isIntersecting: false, intersectionRatio: 0 }]);
const bandShown = (isIntersecting: boolean, target: Element = band) =>
  observers().echo.fire([{ target, isIntersecting }]);

beforeEach(() => {
  installBrowser(true);
  stage = document.createElement("section");
  host = document.createElement("div");
  band = document.createElement("aside");
  band.dataset.stageShape = "1";
  stage.append(host);
  document.body.append(stage, band);
  setSize(host, 800, 400);
  setSize(band, 300, 300);
});

afterEach(() => {
  running.splice(0).forEach((stop) => stop());
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("startInnerScene echo hosts", () => {
  it("watches every echo host", async () => {
    await start(true);
    expect(observers().echo.observed).toEqual([band]);
  });

  it("stays in the hero while it is live, even with an echo in view", async () => {
    const { renderer } = await start(true);
    bandShown(true);
    expect(stage.dataset.scenePhase).toBe("live");
    expect(renderer.domElement.parentElement).toBeNull();
    expect(renderer.setSize).toHaveBeenCalledTimes(1);
  });

  it("moves the canvas into the echo and re-forms its shape there, small", async () => {
    const { renderer, world, particles } = await start(false);
    bandShown(true);
    heroGone();
    expect(stage.dataset.scenePhase).toBe("echo");
    expect(renderer.domElement.parentElement).toBe(band);
    expect(renderer.setSize).toHaveBeenLastCalledWith(300, 300, false);
    expect(world.camera.fov).toBe(50);
    expect(world.root.position.x).toBe(0);
    expect(particles.uniforms.uShape.value).toBe(1);
    expect(world.root.rotation.x).toBe(0);
    expect(particles.uniforms.uPointerMix.value).toBe(0);
  });

  it("restarts the gathering when it reaches an echo", async () => {
    const { particles } = await start(true);
    flushFrame();
    bandShown(true);
    heroGone();
    flushFrame();
    expect(particles.uniforms.uForm.value).toBeCloseTo(0.05 / 2.8);
    expect(particles.uniforms.uPointerMix.value).toBe(0);
    expect(pendingFrames()).toBe(1);
  });

  it("does not move again for the echo it is already in", async () => {
    const { renderer } = await start(false);
    bandShown(true);
    heroGone();
    const sized = renderer.setSize.mock.calls.length;
    bandShown(true);
    expect(renderer.setSize).toHaveBeenCalledTimes(sized);
    expect(stage.dataset.scenePhase).toBe("echo");
  });

  it("returns to the hero and its shape once the echo leaves", async () => {
    const { renderer, world, particles } = await start(false);
    bandShown(true);
    heroGone();
    bandShown(false);
    expect(stage.dataset.scenePhase).toBe("parked");
    expect(renderer.domElement.parentElement).toBe(host);
    expect(world.camera.fov).toBe(40);
    expect(particles.uniforms.uShape.value).toBe(0);
    expect(world.root.rotation.x).toBeCloseTo(0.34);
  });

  it("shows the hero shape in an echo that names no shape", async () => {
    const plain = document.createElement("aside");
    setSize(plain, 200, 100);
    document.body.append(plain);
    const { renderer, particles } = await start(false, [plain]);
    bandShown(true, plain);
    heroGone();
    expect(renderer.domElement.parentElement).toBe(plain);
    expect(particles.uniforms.uShape.value).toBe(0);
  });
});

describe("startInnerScene highlights and resizing", () => {
  it("lights a requested tag and animates the fade while live", async () => {
    const { particles } = await start(true);
    flushFrame();
    highlightStage(2);
    expect(particles.uniforms.uHighlight.value).toBe(2);
    expect(pendingFrames()).toBe(1);
    flushFrame();
    expect(particles.uniforms.uHighlightMix.value).toBeCloseTo(0.05 / 0.35);
  });

  it("shows a highlight at once in the still frame under reduced motion", async () => {
    const { particles, renderer } = await start(false);
    const renders = renderer.render.mock.calls.length;
    highlightStage(4);
    expect(particles.uniforms.uHighlight.value).toBe(4);
    expect(particles.uniforms.uHighlightMix.value).toBe(1);
    expect(renderer.render).toHaveBeenCalledTimes(renders + 1);
  });

  it("re-fits the canvas once a burst of resizes has settled", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { renderer } = await start(false);
    const renders = renderer.render.mock.calls.length;
    setSize(host, 1200, 600);
    globalThis.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(100);
    globalThis.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(100);
    expect(renderer.setSize).not.toHaveBeenCalledWith(1200, 600, false);
    vi.advanceTimersByTime(60);
    expect(renderer.setSize).toHaveBeenLastCalledWith(1200, 600, false);
    expect(renderer.render).toHaveBeenCalledTimes(renders + 1);
  });

  it("drops a pending resize when disposed", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { renderer, stop } = await start(false);
    globalThis.dispatchEvent(new Event("resize"));
    stop();
    globalThis.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(500);
    expect(renderer.setSize).toHaveBeenCalledTimes(1);
  });
});
