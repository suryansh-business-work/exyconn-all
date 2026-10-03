import type { DeviceProfile } from "./quality";

/**
 * What the browser can and wants to do, read once at boot. Shared by the home and inner
 * stages so both start their scene the same way: after first paint, only with WebGL 2.
 */
export const supportsWebGL2 = (): boolean => {
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(context);
  } catch (error) {
    console.warn("WebGL 2 probe failed", error);
    return false;
  }
};

/** Runs `callback` once the page has loaded and the main thread is idle. */
export const whenIdle = (callback: () => void): void => {
  const start = () => {
    if ("requestIdleCallback" in globalThis) {
      globalThis.requestIdleCallback(callback, { timeout: 1500 });
    } else {
      globalThis.setTimeout(callback, 200);
    }
  };
  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
  }
};

interface NavigatorHints {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/** The OS setting or the site's own accessibility drawer switch. */
export const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  document.documentElement.dataset.a11yMotion === "on";

export const readDeviceProfile = (): DeviceProfile => ({
  width: window.innerWidth,
  devicePixelRatio: window.devicePixelRatio || 1,
  cores: navigator.hardwareConcurrency,
  memoryGb: (navigator as Navigator & NavigatorHints).deviceMemory,
  reducedMotion: prefersReducedMotion(),
});

/** The visitor asked the browser to save data (Chromium's Save-Data hint). */
export const wantsSaveData = (): boolean =>
  (navigator as Navigator & NavigatorHints).connection?.saveData === true;
