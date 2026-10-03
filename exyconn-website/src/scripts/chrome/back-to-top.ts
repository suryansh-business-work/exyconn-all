/** Back to top: shown while the reader scrolls back up a long page (see backToTopVisible). */
import { backToTopVisible } from "../../lib/chrome/preferences";

const button = document.getElementById("back-to-top");

if (button) {
  let previousY = globalThis.scrollY;
  let queued = false;

  const update = (): void => {
    queued = false;
    const y = globalThis.scrollY;
    if (y !== previousY) {
      button.dataset.visible = String(backToTopVisible(previousY, y, globalThis.innerHeight));
    }
    previousY = y;
  };

  globalThis.addEventListener(
    "scroll",
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );

  button.addEventListener("click", () => {
    button.dataset.visible = "false";
    globalThis.scrollTo({ top: 0 });
    document.getElementById("main-content")?.focus({ preventScroll: true });
  });
}
