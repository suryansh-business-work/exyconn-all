// @vitest-environment jsdom
/** The inner hero stage's entry point: when it starts the scene and when it keeps the CSS. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  readDeviceProfile,
  supportsWebGL2,
  wantsSaveData,
  whenIdle,
} from "../../../../../src/scripts/stage3d/device";
import { startInnerScene } from "../../../../../src/scripts/stage3d/inner/app";
import { bootInnerStage } from "../../../../../src/scripts/stage3d/inner/boot";
import { selectInnerTier, type DeviceProfile } from "../../../../../src/scripts/stage3d/quality";

vi.mock("../../../../../src/scripts/stage3d/device", () => ({
  readDeviceProfile: vi.fn(),
  supportsWebGL2: vi.fn(),
  wantsSaveData: vi.fn(),
  whenIdle: vi.fn(),
}));
vi.mock("../../../../../src/scripts/stage3d/inner/app", () => ({ startInnerScene: vi.fn() }));

const desktop: DeviceProfile = {
  width: 1440,
  devicePixelRatio: 2,
  cores: 8,
  memoryGb: 8,
  reducedMotion: false,
};
const config = { shapes: ["globe"], accent: ["cyan", "amber"] };

/** Lays out an inner page; `sceneConfig: null` leaves the attribute off. */
const page = ({
  canvas = true,
  sceneConfig = JSON.stringify(config),
}: Readonly<{ canvas?: boolean; sceneConfig?: string | null }> = {}) => {
  const stage = document.createElement("section");
  stage.dataset.innerStage = "";
  if (sceneConfig !== null) {
    stage.dataset.sceneConfig = sceneConfig;
  }
  if (canvas) {
    const host = document.createElement("div");
    host.dataset.stageCanvas = "";
    stage.append(host);
  }
  const echo = document.createElement("aside");
  echo.dataset.stageEcho = "";
  document.body.append(stage, echo);
  return { stage, host: stage.querySelector<HTMLElement>("[data-stage-canvas]"), echo };
};

const pagehide = (persisted: boolean) =>
  window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted }));

beforeEach(() => {
  vi.mocked(readDeviceProfile).mockReturnValue(desktop);
  vi.mocked(supportsWebGL2).mockReturnValue(true);
  vi.mocked(wantsSaveData).mockReturnValue(false);
  vi.mocked(whenIdle).mockImplementation((callback) => callback());
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("bootInnerStage", () => {
  it("does nothing on a page without a stage", () => {
    bootInnerStage();
    expect(supportsWebGL2).not.toHaveBeenCalled();
    expect(whenIdle).not.toHaveBeenCalled();
  });

  it("does nothing when the stage has no canvas host or no scene config", () => {
    const bare = page({ canvas: false });
    bootInnerStage();
    document.body.innerHTML = "";
    const empty = page({ sceneConfig: "" });
    bootInnerStage();
    expect(whenIdle).not.toHaveBeenCalled();
    expect(bare.stage.dataset.scene).toBeUndefined();
    expect(empty.stage.dataset.scene).toBeUndefined();
  });

  it("keeps the static gradient without WebGL 2", () => {
    const { stage } = page();
    vi.mocked(supportsWebGL2).mockReturnValue(false);
    bootInnerStage();
    expect(stage.dataset.scene).toBe("static");
    expect(whenIdle).not.toHaveBeenCalled();
  });

  it("keeps the static gradient under Save-Data and on small-memory devices", () => {
    const saving = page();
    vi.mocked(wantsSaveData).mockReturnValue(true);
    bootInnerStage();
    expect(saving.stage.dataset.scene).toBe("static");
    document.body.innerHTML = "";
    const small = page();
    vi.mocked(wantsSaveData).mockReturnValue(false);
    vi.mocked(readDeviceProfile).mockReturnValue({ ...desktop, memoryGb: 2 });
    bootInnerStage();
    expect(small.stage.dataset.scene).toBe("static");
    expect(startInnerScene).not.toHaveBeenCalled();
  });

  it("starts the scene once idle with the parsed config, tier and echo hosts", async () => {
    const { stage, host, echo } = page();
    vi.mocked(startInnerScene).mockResolvedValue(vi.fn());
    bootInnerStage();
    expect(whenIdle).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(startInnerScene).toHaveBeenCalledTimes(1));
    expect(startInnerScene).toHaveBeenCalledWith({
      stage,
      host,
      echoes: [echo],
      config: { ...config, data: {}, seed: undefined },
      tier: selectInnerTier(desktop),
    });
    expect(stage.dataset.scene).toBeUndefined();
  });

  it("disposes the scene on a real unload but not when kept in the page cache", async () => {
    page();
    const stop = vi.fn();
    vi.mocked(startInnerScene).mockResolvedValue(stop);
    const listening = vi.spyOn(window, "addEventListener");
    bootInnerStage();
    await vi.waitFor(() =>
      expect(listening).toHaveBeenCalledWith("pagehide", expect.any(Function))
    );
    pagehide(true);
    expect(stop).not.toHaveBeenCalled();
    pagehide(false);
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("falls back to the gradient when the scene fails to start", async () => {
    const { stage } = page();
    const failure = new Error("no context");
    vi.mocked(startInnerScene).mockRejectedValue(failure);
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    bootInnerStage();
    await vi.waitFor(() => expect(stage.dataset.scene).toBe("static"));
    expect(logged).toHaveBeenCalledWith("Inner stage scene failed to start", failure);
  });

  it("falls back to the gradient when the config is removed before the page goes idle", async () => {
    const { stage } = page();
    let idle: (() => void) | undefined;
    vi.mocked(whenIdle).mockImplementation((callback) => {
      idle = callback;
    });
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    bootInnerStage();
    delete stage.dataset.sceneConfig;
    idle?.();
    await vi.waitFor(() => expect(stage.dataset.scene).toBe("static"));
    expect(logged).toHaveBeenCalledWith(
      "Inner stage scene failed to start",
      expect.any(SyntaxError)
    );
    expect(startInnerScene).not.toHaveBeenCalled();
  });

  it("falls back to the gradient when the config cannot be drawn", async () => {
    const { stage } = page({ sceneConfig: JSON.stringify({ ...config, shapes: ["teapot"] }) });
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    bootInnerStage();
    await vi.waitFor(() => expect(stage.dataset.scene).toBe("static"));
    expect(logged).toHaveBeenCalledWith("Inner stage scene failed to start", expect.any(Error));
    expect(startInnerScene).not.toHaveBeenCalled();
  });
});
