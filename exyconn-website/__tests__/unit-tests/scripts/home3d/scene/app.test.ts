// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildScene } from "../../../../../src/scripts/home3d/scene/build";
import { lastObserver } from "../../script-dom";
import { eased, startHarness, type Harness } from "./app-harness";

vi.mock("../../../../../src/scripts/home3d/scene/build", () => ({ buildScene: vi.fn() }));
vi.mock("../../../../../src/scripts/home3d/scene/frame", () => ({ applyFrame: vi.fn() }));

let h: Harness | undefined;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  h?.stop();
  h = undefined;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("startScene on start", () => {
  it("builds for the host, sizes the canvas and camera, and draws a first frame", () => {
    h = startHarness();
    const { built } = h;
    expect(buildScene).toHaveBeenCalledWith(h.stage, h.host, h.sceneTier, false);
    expect(built.renderer.setSize).toHaveBeenCalledWith(1200, 600, false);
    expect(built.stage.camera.aspect).toBe(2);
    expect(built.stage.camera.fov).toBe(40);
    expect(built.stage.camera.updateProjectionMatrix).toHaveBeenCalled();
    const sky = built.stage.backdrop.nebula.material.uniforms;
    expect(sky.uResolution.value.toArray()).toEqual([1500, 750]);
    expect(sky.uScrimSide.value.toArray()).toEqual([1, 0]);
    expect(h.drawn).toHaveLength(1);
    expect(h.last()).toMatchObject({ time: 0, story: 0, blueprint: 1, viewportHeight: 1000 });
    expect(built.renderer.render).toHaveBeenCalledWith(built.scene, built.stage.camera);
    expect(h.stage.dataset.scene).toBe("ready");
    expect(lastObserver().observed.has(h.stage)).toBe(true);
    expect(h.frames.pending()).toBe(1);
  });

  it("widens the lens and moves the scrim to the bottom on compact hosts", () => {
    h = startHarness({ width: 500 });
    expect(buildScene).toHaveBeenCalledWith(h.stage, h.host, h.sceneTier, true);
    expect(h.built.stage.camera.fov).toBe(50);
    expect(h.built.stage.backdrop.nebula.material.uniforms.uScrimSide.value.toArray()).toEqual([
      0, 1,
    ]);
    expect(h.last().compact).toBe(true);
  });

  it("keeps a sane aspect for a host with no height yet", () => {
    h = startHarness({ height: 0 });
    expect(h.built.stage.camera.aspect).toBe(1200);
  });
});

describe("startScene animation loop", () => {
  it("advances time and eases the story, blueprint and lean toward the scroll", () => {
    h = startHarness();
    vi.stubGlobal("scrollY", 2500);
    h.frames.flush(16);
    const frame = h.last();
    expect(frame.time).toBeCloseTo(0.016);
    expect(frame.scrollY).toBe(2500);
    expect(frame.story).toBeCloseTo(eased(0, 1, 3.2, 0.016));
    expect(frame.blueprint).toBeCloseTo(eased(1, 0, 4, 0.016));
    expect(frame.lean).toBeCloseTo(eased(0, 0.12, 3, 0.016));
    expect(h.frames.pending()).toBe(1);
  });

  it("caps a long gap between frames at 50 ms", () => {
    h = startHarness();
    h.frames.flush(16);
    h.frames.flush(5000);
    expect(h.last().time).toBeCloseTo(0.066);
  });

  it("does not lean when a frame arrives with no time passed", () => {
    h = startHarness();
    vi.stubGlobal("scrollY", 2500);
    h.frames.flush(0);
    expect(h.last().lean).toBe(0);
    expect(h.last().time).toBe(0);
  });

  it("eases toward the mouse", () => {
    h = startHarness();
    globalThis.dispatchEvent(
      Object.assign(new MouseEvent("pointermove", { clientX: 1000, clientY: 0 }), {
        pointerType: "mouse",
      })
    );
    h.frames.flush(16);
    expect(h.last().pointerX).toBeCloseTo(eased(0, 1, 2.5, 0.016));
    expect(h.last().pointerY).toBeCloseTo(eased(0, 1, 2.5, 0.016));
  });
});

describe("startScene pausing", () => {
  it("stops while the stage is off screen and resumes once it is back", () => {
    h = startHarness();
    const observer = lastObserver();
    observer.emit([h.stage], false);
    expect(h.frames.cancel).toHaveBeenCalled();
    expect(h.frames.pending()).toBe(0);
    observer.emit([h.stage], true);
    expect(h.frames.pending()).toBe(1);
  });

  it("stops while the tab is hidden", () => {
    h = startHarness();
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(h.frames.pending()).toBe(0);
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(h.frames.pending()).toBe(1);
  });
});

describe("startScene disposer", () => {
  it("stops the loop, disconnects, disposes the scene and unmarks the stage", () => {
    h = startHarness();
    const observer = lastObserver();
    const requests = h.frames.request.mock.calls.length;
    h.stop();
    expect(h.frames.pending()).toBe(0);
    expect(observer.disconnect).toHaveBeenCalled();
    expect(h.built.dispose).toHaveBeenCalled();
    expect(h.stage.dataset.scene).toBeUndefined();

    const sizes = h.built.renderer.setSize.mock.calls.length;
    globalThis.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(200);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(h.built.renderer.setSize).toHaveBeenCalledTimes(sizes);
    expect(h.frames.request).toHaveBeenCalledTimes(requests);
  });
});
