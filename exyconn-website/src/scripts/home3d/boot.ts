import { selectQualityTier } from "./quality";
import { setupRail, setupReveal } from "./ui";

/**
 * Entry point for the home page. The page is complete without any of this: the chapters are
 * real HTML over a CSS gradient. After the page has loaded and gone idle, Three.js is
 * fetched as a separate chunk and the scene fades in behind the text. Browsers without
 * WebGL 2 keep the gradient.
 */
const supportsWebGL2 = (): boolean => {
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(context);
  } catch (error) {
    console.warn("WebGL 2 probe failed", error);
    return false;
  }
};

const whenIdle = (callback: () => void): void => {
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
}

const startWebGL = async (stage: HTMLElement, host: HTMLElement, chapters: HTMLElement[]) => {
  const tier = selectQualityTier({
    width: window.innerWidth,
    devicePixelRatio: window.devicePixelRatio || 1,
    cores: navigator.hardwareConcurrency,
    memoryGb: (navigator as Navigator & NavigatorHints).deviceMemory,
    reducedMotion:
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.a11yMotion === "on",
  });
  const { startScene } = await import("./scene/app");
  return startScene({ stage, host, chapters, tier });
};

export const bootHome = (): void => {
  const stage = document.querySelector<HTMLElement>("[data-home-stage]");
  const host = stage?.querySelector<HTMLElement>("[data-home-canvas]");
  if (!stage || !host) {
    return;
  }
  const chapters = [...stage.querySelectorAll<HTMLElement>("[data-chapter]")];
  const cleanups = [setupReveal(stage), setupRail(stage, chapters)];
  // A page kept in the back/forward cache comes back as it was; only a real unload disposes.
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) {
      cleanups.forEach((cleanup) => cleanup());
    }
  });
  if (!supportsWebGL2()) {
    stage.dataset.scene = "fallback";
    return;
  }
  whenIdle(() => {
    startWebGL(stage, host, chapters)
      .then((stop) => cleanups.push(stop))
      .catch((error: unknown) => {
        console.error("Home scene failed to start", error);
        stage.dataset.scene = "fallback";
      });
  });
};
