import { clamp, damp } from "../math";

/**
 * What the visitor is doing to the inner stage, smoothed for the frame loop.
 *
 * - The pointer, in the canvas's NDC (−1…1): the scene leans towards it and, while it is
 *   over the canvas (`near` → 1), the points under it scatter and light. Mouse and pen only
 *   — on a touch screen a drag is a scroll, and the scene must not jump under the thumb.
 * - Scroll: how far the hero has left the screen (0 = all of it on screen, 1 = gone), which
 *   turns the scene and brings the camera in as the visitor reads on.
 *
 * Nothing is listened to when motion is reduced; every value then stays at rest.
 */
export interface StageInput {
  x: number;
  y: number;
  near: number;
  scroll: number;
}

/** How far the hero has scrolled off the top, 0 to 1. */
export const heroScroll = (top: number, height: number): number =>
  clamp(-top / Math.max(1, height));

const POINTER_SPEED = 4;
const NEAR_SPEED = 6;
const SCROLL_SPEED = 8;

export const createStageInput = (
  stage: HTMLElement,
  canvas: () => HTMLElement,
  enabled: boolean
) => {
  const goal = { x: 0, y: 0, near: 0 };
  const now: StageInput = { x: 0, y: 0, near: 0, scroll: 0 };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") {
      return;
    }
    const rect = canvas().getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const y = 1 - ((event.clientY - rect.top) / Math.max(1, rect.height)) * 2;
    goal.x = clamp(x, -1, 1);
    goal.y = clamp(y, -1, 1);
    goal.near = Math.abs(x) <= 1 && Math.abs(y) <= 1 ? 1 : 0;
  };
  const onLeave = () => {
    goal.near = 0;
    goal.x = 0;
    goal.y = 0;
  };

  if (enabled) {
    globalThis.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
  }

  return {
    /** Advances the smoothed input by `dt` seconds; `onHero` is false while the canvas is away. */
    step: (dt: number, onHero: boolean): StageInput => {
      if (!enabled) {
        return now;
      }
      const rect = stage.getBoundingClientRect();
      const scroll = onHero ? heroScroll(rect.top, rect.height) : 0;
      now.x = damp(now.x, goal.x, POINTER_SPEED, dt);
      now.y = damp(now.y, goal.y, POINTER_SPEED, dt);
      now.near = damp(now.near, goal.near, NEAR_SPEED, dt);
      now.scroll = damp(now.scroll, scroll, SCROLL_SPEED, dt);
      return now;
    },
    dispose: () => {
      globalThis.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    },
  };
};
