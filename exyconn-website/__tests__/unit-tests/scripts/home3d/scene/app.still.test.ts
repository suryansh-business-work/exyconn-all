// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lastObserver } from "../../script-dom";
import { startHarness, type Harness } from "./app-harness";

vi.mock("../../../../../src/scripts/home3d/scene/build", () => ({ buildScene: vi.fn() }));
vi.mock("../../../../../src/scripts/home3d/scene/frame", () => ({ applyFrame: vi.fn() }));

let h: Harness | undefined;

const scrollTo = (y: number) => {
  vi.stubGlobal("scrollY", y);
  globalThis.dispatchEvent(new Event("scroll"));
};
const resize = () => globalThis.dispatchEvent(new Event("resize"));

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

describe("startScene under reduced motion", () => {
  it("draws a composed still of the chapter without starting a loop or tracking the mouse", () => {
    h = startHarness({ tier: { animate: false } });
    expect(h.frames.request).not.toHaveBeenCalled();
    // The first frame, then the still for the opening chapter as a faint blueprint.
    expect(h.drawn).toHaveLength(2);
    expect(h.last()).toMatchObject({ time: 8, story: 0, blueprint: 0.6 });

    globalThis.dispatchEvent(
      Object.assign(new MouseEvent("pointermove", { clientX: 1000 }), { pointerType: "mouse" })
    );
    lastObserver().emit([h.stage], true);
    expect(h.frames.request).not.toHaveBeenCalled();
  });

  it("redraws only when the reader reaches another chapter", () => {
    h = startHarness({ tier: { animate: false } });
    // Still the opening chapter with the blueprint mostly up: the same still.
    scrollTo(50);
    expect(h.drawn).toHaveLength(2);
    // The blueprint has gone: a new still, then none while that holds.
    scrollTo(600);
    expect(h.drawn).toHaveLength(3);
    expect(h.last()).toMatchObject({ story: 0, blueprint: 0 });
    scrollTo(620);
    expect(h.drawn).toHaveLength(3);
    // The next chapter has arrived.
    scrollTo(2500);
    expect(h.drawn).toHaveLength(4);
    expect(h.last()).toMatchObject({ story: 1, blueprint: 0, pointerX: 0 });
  });

  it("re-measures and redraws the still once resizing settles", () => {
    h = startHarness({ tier: { animate: false } });
    h.size.width = 500;
    resize();
    vi.advanceTimersByTime(100);
    resize();
    vi.advanceTimersByTime(149);
    expect(h.built.renderer.setSize).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(h.built.renderer.setSize).toHaveBeenCalledTimes(2);
    expect(h.built.renderer.setSize).toHaveBeenLastCalledWith(500, 600, false);
    expect(h.drawn).toHaveLength(3);
    expect(h.last().compact).toBe(true);
  });

  it("stops listening to scroll once disposed", () => {
    h = startHarness({ tier: { animate: false } });
    h.stop();
    scrollTo(2500);
    expect(h.drawn).toHaveLength(2);
  });
});

describe("startScene resizing while animating", () => {
  it("re-measures once resizing settles and leaves drawing to the loop", () => {
    h = startHarness();
    h.size.height = 900;
    resize();
    vi.advanceTimersByTime(150);
    expect(h.built.renderer.setSize).toHaveBeenLastCalledWith(1200, 900, false);
    expect(h.built.stage.camera.aspect).toBeCloseTo(1200 / 900);
    expect(h.drawn).toHaveLength(1);
  });
});
