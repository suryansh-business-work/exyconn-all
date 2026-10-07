// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeviceProfile } from "../../../../src/scripts/stage3d/quality";

const mocks = vi.hoisted(() => ({
  supportsWebGL2: vi.fn(),
  whenIdle: vi.fn(),
  readDeviceProfile: vi.fn(),
  setupReveal: vi.fn(),
  setupRail: vi.fn(),
  startScene: vi.fn(),
}));
vi.mock("../../../../src/scripts/stage3d/device", () => ({
  supportsWebGL2: mocks.supportsWebGL2,
  whenIdle: mocks.whenIdle,
  readDeviceProfile: mocks.readDeviceProfile,
}));
vi.mock("../../../../src/scripts/home3d/ui", () => ({
  setupReveal: mocks.setupReveal,
  setupRail: mocks.setupRail,
}));
vi.mock("../../../../src/scripts/home3d/scene/app", () => ({ startScene: mocks.startScene }));

import { bootHome } from "../../../../src/scripts/home3d/boot";

const STAGE = `
  <div data-home-stage>
    <div data-home-canvas></div>
    <section data-chapter id="one"></section>
    <section data-chapter id="two"></section>
  </div>
`;
const desktop: DeviceProfile = {
  width: 1920,
  devicePixelRatio: 2,
  cores: 8,
  memoryGb: 8,
  reducedMotion: false,
};

const stage = () => document.querySelector<HTMLElement>("[data-home-stage]") as HTMLElement;
const pageHide = (persisted: boolean) =>
  globalThis.dispatchEvent(Object.assign(new Event("pagehide"), { persisted }));
const runIdle = () => {
  const [callback] = mocks.whenIdle.mock.calls[0] as [() => void];
  callback();
};

let stopReveal: ReturnType<typeof vi.fn>;
let stopRail: ReturnType<typeof vi.fn>;

beforeEach(() => {
  stopReveal = vi.fn();
  stopRail = vi.fn();
  mocks.setupReveal.mockReturnValue(stopReveal);
  mocks.setupRail.mockReturnValue(stopRail);
  mocks.readDeviceProfile.mockReturnValue(desktop);
  document.body.innerHTML = STAGE;
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("bootHome", () => {
  it("does nothing on a page without the stage or its canvas host", () => {
    document.body.innerHTML = "<main></main>";
    bootHome();
    document.body.innerHTML = "<div data-home-stage></div>";
    bootHome();
    expect(mocks.setupReveal).not.toHaveBeenCalled();
  });

  it("keeps the CSS gradient when WebGL 2 is missing, with reveal and rail still running", () => {
    mocks.supportsWebGL2.mockReturnValue(false);
    bootHome();
    expect(stage().dataset.scene).toBe("fallback");
    expect(mocks.setupReveal).toHaveBeenCalledWith(stage());
    expect(mocks.setupRail).toHaveBeenCalledWith(stage(), [
      document.getElementById("one"),
      document.getElementById("two"),
    ]);
    expect(mocks.whenIdle).not.toHaveBeenCalled();
  });

  it("starts the scene once idle with the device's tier, and disposes it on unload", async () => {
    const stopScene = vi.fn();
    mocks.supportsWebGL2.mockReturnValue(true);
    mocks.startScene.mockReturnValue(stopScene);
    bootHome();
    expect(mocks.startScene).not.toHaveBeenCalled();
    runIdle();
    await vi.waitFor(() => expect(mocks.startScene).toHaveBeenCalledTimes(1));
    const options = mocks.startScene.mock.calls[0][0];
    expect(options.stage).toBe(stage());
    expect(options.host).toBe(document.querySelector("[data-home-canvas]"));
    expect(options.chapters).toHaveLength(2);
    expect(options.tier.name).toBe("high");
    await new Promise((resolve) => setTimeout(resolve, 0));

    pageHide(true);
    expect(stopScene).not.toHaveBeenCalled();
    pageHide(false);
    expect(stopReveal).toHaveBeenCalled();
    expect(stopRail).toHaveBeenCalled();
    expect(stopScene).toHaveBeenCalled();
  });

  it("falls back to the gradient and logs when the scene fails to start", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const failure = new Error("context lost");
    mocks.supportsWebGL2.mockReturnValue(true);
    mocks.startScene.mockImplementation(() => {
      throw failure;
    });
    bootHome();
    runIdle();
    await vi.waitFor(() => expect(stage().dataset.scene).toBe("fallback"));
    expect(logged).toHaveBeenCalledWith("Home scene failed to start", failure);
  });
});
