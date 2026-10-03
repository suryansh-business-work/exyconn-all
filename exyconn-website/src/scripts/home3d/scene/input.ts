import { blueprintAmount, storyPosition } from "../story";

/**
 * Reads the page for the scene: where each chapter starts, where the reader is, and where
 * the mouse points. Layout is measured on resize only, so scrolling never forces a reflow.
 */
export interface ScrollModel {
  anchors: number[];
  blend: number;
  viewportHeight: number;
}

/** A chapter "arrives" when its top reaches the middle of the viewport. */
export const measureChapters = (chapters: readonly HTMLElement[]): ScrollModel => {
  const viewportHeight = window.innerHeight;
  const anchors = chapters.map((chapter, index) =>
    index === 0 ? 0 : chapter.getBoundingClientRect().top + window.scrollY - viewportHeight * 0.5
  );
  return { anchors, blend: viewportHeight * 0.8, viewportHeight };
};

export const scrollTargets = (model: ScrollModel, scrollY: number) => ({
  story: storyPosition(model.anchors, scrollY, model.blend),
  blueprint: blueprintAmount(scrollY, model.viewportHeight * 0.55),
});

export interface Pointer {
  x: number;
  y: number;
}

/** Mouse position in [-1, 1]; touch is ignored so a finger only ever scrolls. */
export const trackPointer = (pointer: Pointer): (() => void) => {
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") {
      return;
    }
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  return () => window.removeEventListener("pointermove", onMove);
};
