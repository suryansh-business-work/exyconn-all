import { onceInView } from "./motion";

/**
 * Body chapter headings (`.inner-section [data-reveal-line]`) and architecture diagrams
 * reveal as they enter. Armed only here, so without JavaScript everything is visible.
 */
export const bootReveals = (): void => {
  const root = document.documentElement;
  if (root.dataset.innerReveal !== undefined) {
    return;
  }
  root.dataset.innerReveal = "";
  onceInView(document.querySelectorAll(".inner-section [data-reveal-line]"), (line) =>
    line.classList.add("is-revealed")
  );
  const diagrams = document.querySelectorAll<HTMLElement>(".inner-arch");
  diagrams.forEach((diagram) => {
    diagram.dataset.revealReady = "";
  });
  onceInView(diagrams, (diagram) => diagram.classList.add("is-revealed"));
};
