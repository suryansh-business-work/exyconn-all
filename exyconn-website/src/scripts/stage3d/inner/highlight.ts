import { HIGHLIGHT_EVENT, type HighlightDetail } from "../events";
import { parseHighlight } from "./state";

/**
 * Feeds highlight requests to the scene: `highlightStage(tag)` events, and hover or focus on
 * any `[data-stage-highlight]` element (cards, chips). Returns a disposer.
 */
const SELECTOR = "[data-stage-highlight]";

const tagOf = (target: EventTarget | null): HTMLElement | null =>
  target instanceof Element ? target.closest<HTMLElement>(SELECTOR) : null;

export const listenForHighlights = (onTag: (tag: number) => void): (() => void) => {
  const onEvent = (event: Event) => onTag((event as CustomEvent<HighlightDetail>).detail.tag);
  const onEnter = (event: Event) => {
    const element = tagOf(event.target);
    if (element) {
      onTag(parseHighlight(element.dataset.stageHighlight));
    }
  };
  const onLeave = (event: Event) => {
    const element = tagOf(event.target);
    const next = (event as FocusEvent | PointerEvent).relatedTarget;
    if (element && !(next instanceof Node && element.contains(next))) {
      onTag(-1);
    }
  };
  document.addEventListener(HIGHLIGHT_EVENT, onEvent);
  document.addEventListener("pointerover", onEnter, { passive: true });
  document.addEventListener("pointerout", onLeave, { passive: true });
  document.addEventListener("focusin", onEnter);
  document.addEventListener("focusout", onLeave);
  return () => {
    document.removeEventListener(HIGHLIGHT_EVENT, onEvent);
    document.removeEventListener("pointerover", onEnter);
    document.removeEventListener("pointerout", onLeave);
    document.removeEventListener("focusin", onEnter);
    document.removeEventListener("focusout", onLeave);
  };
};
