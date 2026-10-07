// @vitest-environment jsdom
/** The inner scene loop in the hero: start-up, framing, frames on demand and teardown. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startInnerScene } from "../../../../../src/scripts/stage3d/inner/app";
import type { ResolvedScene } from "../../../../../src/scripts/stage3d/inner/config";
import { buildInnerWorld } from "../../../../../src/scripts/stage3d/inner/scene";
import { FORM_SECONDS } from "../../../../../src/scripts/stage3d/inner/state";
import {
  flushAll,
  flushFrame,
  installBrowser,
  makeTier,
  makeWorld,
  observers,
  pendingFrames,
  setSize,
} from "./app.fixture";

vi.mock("../../../../../src/scripts/stage3d/inner/scene", () => ({ buildInnerWorld: vi.fn() }));

const config: ResolvedScene = { shapes: ["city"], data: {}, accent: ["violet", "amber"] };

let stage: HTMLElement;
let host: HTMLElement;
/** Every scene a test starts, disposed after it so no listener leaks into the next test. */
const running: Array<() => void> = [];

const start = async (animate: boolean, parts?: Parameters<typeof makeWorld>[0]) => {
  const made = makeWorld(parts);
  vi.mocked(buildInnerWorld).mockReturnValue(made.world);
  const tier = makeTier(animate);
  const stop = await startInnerScene({ stage, host, echoes: [], config, tier });
  running.push(stop);
  return { ...made, stop, tier };
};

beforeEach(() => {
  stage = document.createElement("section");
  host = document.createElement("div");
  stage.append(host);
  document.body.append(stage);
  setSize(host, 800, 400);
});

afterEach(() => {
  running.splice(0).forEach((stop) => stop());
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("startInnerScene start-up", () => {
  beforeEach(() => {
    installBrowser(true);
  });

  it("builds the world, compiles before the first frame and marks the stage ready", async () => {
    const { world, renderer, tier } = await start(true);
    expect(buildInnerWorld).toHaveBeenCalledWith(stage, host, config, tier);
    expect(renderer.compileAsync).toHaveBeenCalledWith(world.scene, world.camera);
    expect(renderer.render).toHaveBeenCalledWith(world.scene, world.camera);
    expect(stage.dataset.scene).toBe("ready");
    expect(stage.dataset.scenePhase).toBeUndefined();
    expect(observers().hero.observed).toEqual([stage]);
    expect(observers().hero.options?.threshold).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(observers().echo.options?.threshold).toBe(0.2);
    expect(pendingFrames()).toBe(1);
  });

  it("frames a wide hero to the right with the nebula filling the canvas", async () => {
    const { world, renderer, particles, backdrop } = await start(true);
    expect(renderer.setSize).toHaveBeenCalledWith(800, 400, false);
    expect(world.camera.aspect).toBe(2);
    expect(world.camera.fov).toBe(40);
    expect(world.camera.position.z).toBeCloseTo(7.4);
    expect(world.root.position.x).toBeCloseTo(2.1);
    expect(particles.uniforms.uAspect.value).toBe(2);
    expect(backdrop.visible).toBe(true);
    expect(backdrop.material.uniforms.uResolution.value.toArray()).toEqual([1600, 800]);
  });

  it("guards a host with no height when setting the aspect", async () => {
    setSize(host, 640, 0);
    const { world } = await start(true);
    expect(world.camera.aspect).toBe(640);
  });

  it("feeds the structure and nebula the protagonist's clock, form and turn", async () => {
    const { particles, structure, backdrop } = await start(true);
    flushFrame();
    expect(particles.uniforms.uTime.value).toBeCloseTo(0.05);
    expect(structure.uniforms.uTime.value).toBe(particles.uniforms.uTime.value);
    expect(structure.uniforms.uForm.value).toBe(particles.uniforms.uForm.value);
    expect(structure.uniforms.uAngle.value).toBe(particles.uniforms.uAngle.value);
    expect(structure.uniforms.uLineMix.value).toBe(1);
    expect(backdrop.material.uniforms.uTime.value).toBe(particles.uniforms.uTime.value);
  });

  it("runs without a structure or a nebula", async () => {
    const { renderer, world } = await start(true, { nebula: false, lines: false });
    flushFrame();
    expect(world.lines).toBeNull();
    expect(renderer.render).toHaveBeenCalledTimes(2);
  });

  it("eases the camera down onto a built scene by its pitch", async () => {
    const { world } = await start(true);
    expect(world.root.rotation.x).toBe(0);
    flushFrame();
    expect(world.root.rotation.x).toBeCloseTo(0.34 * (1 - Math.exp(-0.15)));
  });
});

describe("startInnerScene frames on demand", () => {
  beforeEach(() => {
    installBrowser(false);
  });

  it("frames a narrow hero centred, without the nebula", async () => {
    const { world, backdrop } = await start(true);
    expect(world.camera.fov).toBe(50);
    expect(world.camera.position.z).toBeCloseTo(5.8);
    expect(world.root.position.x).toBe(0);
    expect(backdrop.visible).toBe(false);
  });

  it("keeps animating while live, then finishes the form and stops once dimmed", async () => {
    const { particles } = await start(true);
    flushFrame();
    flushFrame();
    expect(pendingFrames()).toBe(1);
    observers().hero.fire([{ isIntersecting: true, intersectionRatio: 0.3 }]);
    expect(stage.dataset.scenePhase).toBe("dimmed");
    expect(flushAll()).toBeLessThan(400);
    expect(pendingFrames()).toBe(0);
    expect(particles.uniforms.uForm.value).toBe(1);
    expect(particles.uniforms.uTime.value).toBeGreaterThanOrEqual(FORM_SECONDS);
  });

  it("draws nothing once the hero has gone and resumes when it returns", async () => {
    await start(true);
    observers().hero.fire([{ isIntersecting: false, intersectionRatio: 0 }]);
    expect(stage.dataset.scenePhase).toBe("parked");
    expect(pendingFrames()).toBe(0);
    observers().hero.fire([{ isIntersecting: true, intersectionRatio: 0.8 }]);
    expect(stage.dataset.scenePhase).toBe("live");
    expect(pendingFrames()).toBe(1);
  });

  it("pauses in a hidden tab and resumes when it is shown again", async () => {
    await start(true);
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(pendingFrames()).toBe(0);
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(pendingFrames()).toBe(1);
  });

  it("draws one still frame of the finished shape under reduced motion", async () => {
    const { world, renderer, particles } = await start(false);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(renderer.render).toHaveBeenCalledTimes(2);
    expect(particles.uniforms.uTime.value).toBe(6);
    expect(particles.uniforms.uForm.value).toBe(1);
    expect(particles.uniforms.uPointerMix.value).toBe(0);
    expect(world.root.rotation.x).toBeCloseTo(0.34);
  });

  it("releases every listener, observer and frame when disposed", async () => {
    const { world, stop, particles, renderer } = await start(true);
    observers().hero.fire([{ isIntersecting: true, intersectionRatio: 1 }]);
    stop();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(pendingFrames()).toBe(0);
    expect(observers().hero.disconnect).toHaveBeenCalled();
    expect(observers().echo.disconnect).toHaveBeenCalled();
    expect(world.dispose).toHaveBeenCalledTimes(1);
    expect(stage.dataset.scene).toBeUndefined();
    expect(stage.dataset.scenePhase).toBeUndefined();
    const renders = renderer.render.mock.calls.length;
    document.dispatchEvent(new Event("visibilitychange"));
    document.dispatchEvent(new CustomEvent("stage3d:highlight", { detail: { tag: 3 } }));
    expect(pendingFrames()).toBe(0);
    expect(particles.uniforms.uHighlight.value).toBe(-1);
    expect(renderer.render).toHaveBeenCalledTimes(renders);
  });
});
