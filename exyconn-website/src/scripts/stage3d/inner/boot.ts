import { readDeviceProfile, supportsWebGL2, wantsSaveData, whenIdle } from "../device";
import { selectInnerTier, wantsStaticScene } from "../quality";
import { parseScene } from "./config";

/**
 * Entry point for an inner page's hero stage (InnerStage.astro). The page is complete
 * without it: the hero is HTML over a CSS gradient. After load and idle, three.js arrives as
 * a separate chunk and the scene fades in. No WebGL 2, Save-Data or a ≤ 2 GB device keep the
 * gradient (`data-scene="static"`); a failure falls back to it too.
 */
const start = async (stage: HTMLElement, host: HTMLElement) => {
  const config = parseScene(stage.dataset.sceneConfig ?? "");
  const tier = selectInnerTier(readDeviceProfile());
  const echoes = [...document.querySelectorAll<HTMLElement>("[data-stage-echo]")];
  const { startInnerScene } = await import("./app");
  return startInnerScene({ stage, host, echoes, config, tier });
};

export const bootInnerStage = (): void => {
  const stage = document.querySelector<HTMLElement>("[data-inner-stage]");
  const host = stage?.querySelector<HTMLElement>("[data-stage-canvas]");
  if (!stage || !host || !stage.dataset.sceneConfig) {
    return;
  }
  if (!supportsWebGL2() || wantsStaticScene(readDeviceProfile(), wantsSaveData())) {
    stage.dataset.scene = "static";
    return;
  }
  whenIdle(() => {
    start(stage, host)
      .then((stop) => {
        // A page kept in the back/forward cache comes back as it was; only a real unload disposes.
        window.addEventListener("pagehide", (event) => {
          if (!event.persisted) {
            stop();
          }
        });
      })
      .catch((error: unknown) => {
        console.error("Inner stage scene failed to start", error);
        stage.dataset.scene = "static";
      });
  });
};
