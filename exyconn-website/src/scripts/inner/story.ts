import { highlightStage } from "../stage3d/events";

/**
 * Scroll stories (`[data-stage-story]`): the step crossing the middle of the screen is the
 * active one — it is marked `data-active` and lights its use case (`data-story-step`, a scene
 * tag) in the scene pinned beside the steps. Leaving the story clears both. Without
 * JavaScript, or without a scene, the steps are a plain list.
 */
const ACTIVE = "active";

const activate = (story: HTMLElement, step: HTMLElement | null): void => {
  story.querySelectorAll<HTMLElement>("[data-story-step]").forEach((item) => {
    item.toggleAttribute(`data-${ACTIVE}`, item === step);
  });
  const tag = Number.parseInt(step?.dataset.storyStep ?? "", 10);
  highlightStage(Number.isFinite(tag) ? tag : null);
};

const watchStory = (story: HTMLElement): void => {
  const steps = new IntersectionObserver(
    (entries) => {
      const entering = entries.find((entry) => entry.isIntersecting);
      if (entering) {
        activate(story, entering.target as HTMLElement);
      }
    },
    // A band across the middle of the screen: one step at a time is in it.
    { rootMargin: "-45% 0px -45% 0px" }
  );
  story.querySelectorAll("[data-story-step]").forEach((step) => steps.observe(step));
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) {
      activate(story, null);
    }
  }).observe(story);
};

export const bootStories = (): void => {
  document.querySelectorAll<HTMLElement>("[data-stage-story]").forEach(watchStory);
};
