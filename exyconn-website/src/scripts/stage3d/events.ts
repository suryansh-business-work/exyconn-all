/**
 * How a page talks to its stage without importing three: a card, a filter or a form step
 * dispatches an event on `document`; the scene (if one is running) listens. With no scene
 * the event is simply unheard.
 *
 * Declarative alternative: `data-stage-highlight="2"` on any element lights tag 2 while it
 * is hovered or focused.
 */
export const HIGHLIGHT_EVENT = "stage3d:highlight";

export interface HighlightDetail {
  /** The tag to light, or −1 for none. */
  tag: number;
}

export const highlightStage = (tag: number | null): void => {
  document.dispatchEvent(
    new CustomEvent<HighlightDetail>(HIGHLIGHT_EVENT, { detail: { tag: tag ?? -1 } })
  );
};
