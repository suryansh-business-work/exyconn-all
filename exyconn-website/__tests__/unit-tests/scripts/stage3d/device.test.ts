// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  prefersReducedMotion,
  readDeviceProfile,
  supportsWebGL2,
  wantsSaveData,
  whenIdle,
} from "../../../../src/scripts/stage3d/device";
import { stubMatchMedia } from "../script-dom";

const canvasGives = (context: unknown) =>
  vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(context as RenderingContext | null);

const readyState = (state: DocumentReadyState) =>
  vi.spyOn(document, "readyState", "get").mockReturnValue(state);

/** Runs `body` in a browser without requestIdleCallback (Safari), restoring it afterwards. */
const withoutIdleCallback = (body: () => void) => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, "requestIdleCallback");
  Reflect.deleteProperty(globalThis, "requestIdleCallback");
  try {
    body();
  } finally {
    if (saved) {
      Object.defineProperty(globalThis, "requestIdleCallback", saved);
    }
  }
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.a11yMotion;
});

describe("supportsWebGL2", () => {
  it("is true with a WebGL 2 context, which it releases straight away", () => {
    const loseContext = vi.fn();
    canvasGives({ getExtension: vi.fn(() => ({ loseContext })) });
    expect(supportsWebGL2()).toBe(true);
    expect(loseContext).toHaveBeenCalled();
  });

  it("is true even when the context cannot be released early", () => {
    canvasGives({ getExtension: vi.fn(() => null) });
    expect(supportsWebGL2()).toBe(true);
  });

  it("is false without a context", () => {
    canvasGives(null);
    expect(supportsWebGL2()).toBe(false);
  });

  it("is false, with a warning, when probing throws", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const failure = new Error("blocked");
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
      throw failure;
    });
    expect(supportsWebGL2()).toBe(false);
    expect(warn).toHaveBeenCalledWith("WebGL 2 probe failed", failure);
  });
});

describe("whenIdle", () => {
  it("asks for an idle slot within 1.5 s once the page has loaded", () => {
    readyState("complete");
    const idle = vi.fn();
    vi.stubGlobal("requestIdleCallback", idle);
    const callback = vi.fn();
    whenIdle(callback);
    expect(idle).toHaveBeenCalledWith(callback, { timeout: 1500 });
  });

  it("waits 200 ms where idle callbacks are not supported", () => {
    readyState("complete");
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const callback = vi.fn();
    withoutIdleCallback(() => whenIdle(callback));
    vi.advanceTimersByTime(199);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("waits for the load event while the page is still loading", () => {
    readyState("loading");
    const idle = vi.fn();
    vi.stubGlobal("requestIdleCallback", idle);
    whenIdle(vi.fn());
    expect(idle).not.toHaveBeenCalled();
    globalThis.dispatchEvent(new Event("load"));
    globalThis.dispatchEvent(new Event("load"));
    expect(idle).toHaveBeenCalledTimes(1);
  });
});

describe("prefersReducedMotion", () => {
  it("follows the OS setting", () => {
    stubMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
  });

  it("follows the site's accessibility switch", () => {
    stubMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
    document.documentElement.dataset.a11yMotion = "on";
    expect(prefersReducedMotion()).toBe(true);
  });
});

describe("readDeviceProfile", () => {
  it("reads the viewport and the hardware hints", () => {
    stubMatchMedia(false);
    vi.stubGlobal("innerWidth", 1280);
    vi.stubGlobal("devicePixelRatio", 2);
    vi.stubGlobal("navigator", { hardwareConcurrency: 6, deviceMemory: 4 });
    expect(readDeviceProfile()).toEqual({
      width: 1280,
      devicePixelRatio: 2,
      cores: 6,
      memoryGb: 4,
      reducedMotion: false,
    });
  });

  it("counts a missing pixel ratio as 1 and leaves unknown hints out", () => {
    stubMatchMedia(true);
    vi.stubGlobal("innerWidth", 390);
    vi.stubGlobal("devicePixelRatio", 0);
    vi.stubGlobal("navigator", {});
    expect(readDeviceProfile()).toEqual({
      width: 390,
      devicePixelRatio: 1,
      cores: undefined,
      memoryGb: undefined,
      reducedMotion: true,
    });
  });
});

describe("wantsSaveData", () => {
  it("is true only when the browser sends Save-Data", () => {
    vi.stubGlobal("navigator", { connection: { saveData: true } });
    expect(wantsSaveData()).toBe(true);
    vi.stubGlobal("navigator", { connection: { saveData: false } });
    expect(wantsSaveData()).toBe(false);
    vi.stubGlobal("navigator", {});
    expect(wantsSaveData()).toBe(false);
  });
});
