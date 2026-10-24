import { useLayoutEffect, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { moveDock, resizeDock, type DockPosition, type DockSize } from './dockStore';
import { place } from './useDockDrag';

/** The side of the panel being pulled: an edge, the bottom-right corner or the top-left one. */
export type ResizeEdge = 'left' | 'top' | 'right' | 'bottom' | 'corner' | 'top-left';

/** The smallest the panel can be made: the header and a form's fields still fit. */
export const MIN_DOCK_SIZE: DockSize = { width: 400, height: 240 };

const GROWS_LEFT: ReadonlySet<ResizeEdge> = new Set(['left', 'top-left']);
const GROWS_UP: ReadonlySet<ResizeEdge> = new Set(['top', 'top-left']);
const GROWS_RIGHT: ReadonlySet<ResizeEdge> = new Set(['right', 'corner']);
const GROWS_DOWN: ReadonlySet<ResizeEdge> = new Set(['bottom', 'corner']);

/** The styles a drag or a resize writes straight on the element. */
const LIVE_STYLES = ['left', 'top', 'right', 'bottom', 'width', 'height', 'maxHeight'] as const;

/** Grows or shrinks one side, never below the minimum nor past the window's edge. */
function clampSide(wanted: number, min: number, room: number) {
  return Math.max(min, Math.min(wanted, room));
}

/** One axis of a resize: where the panel starts and how long it is after the pointer moved. */
function resizeAxis(
  start: number,
  length: number,
  moved: number,
  grows: { before: boolean; after: boolean; min: number; room: number },
) {
  if (grows.before) {
    const next = clampSide(length - moved, grows.min, start + length);
    return { start: start + length - next, length: next };
  }
  if (grows.after) {
    return { start, length: clampSide(length + moved, grows.min, grows.room - start) };
  }
  return { start, length };
}

/**
 * Resizes the dock panel from any of its edges or its two outer corners with pointer events,
 * between {@link MIN_DOCK_SIZE} and the window's edges, so a panel in the bottom-right corner
 * can grow left and up to the whole width. The panel is pinned by its top-left corner, which
 * moves with a left or top edge; the result goes to the store.
 */
export function startDockResize(
  panel: HTMLElement | null,
  edge: ResizeEdge,
  event: ReactPointerEvent<HTMLElement>,
) {
  if (!panel || event.button !== 0) {
    return;
  }
  event.preventDefault();
  const handle = event.currentTarget;
  const rect = panel.getBoundingClientRect();
  let corner: DockPosition = { x: rect.left, y: rect.top };
  const startX = event.clientX;
  const startY = event.clientY;
  let last: DockSize = { width: rect.width, height: rect.height };
  place(panel, corner);
  handle.setPointerCapture(event.pointerId);

  const onMove = (move: PointerEvent) => {
    const x = resizeAxis(rect.left, rect.width, move.clientX - startX, {
      before: GROWS_LEFT.has(edge),
      after: GROWS_RIGHT.has(edge),
      min: MIN_DOCK_SIZE.width,
      room: globalThis.innerWidth,
    });
    const y = resizeAxis(rect.top, rect.height, move.clientY - startY, {
      before: GROWS_UP.has(edge),
      after: GROWS_DOWN.has(edge),
      min: MIN_DOCK_SIZE.height,
      room: globalThis.innerHeight,
    });
    corner = { x: x.start, y: y.start };
    last = { width: x.length, height: y.length };
    place(panel, corner);
    panel.style.width = `${last.width}px`;
    panel.style.height = `${last.height}px`;
    panel.style.maxHeight = 'none';
  };
  const onEnd = () => {
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onEnd);
    handle.removeEventListener('pointercancel', onEnd);
    moveDock(corner);
    resizeDock(last);
  };
  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onEnd);
  handle.addEventListener('pointercancel', onEnd);
}

/**
 * Drops the styles a drag or resize wrote on the element once the store has the new layout
 * (or it was maximized, restored or reset), so the panel's own styles apply again.
 */
export function useClearLiveStyles(
  panelRef: RefObject<HTMLElement | null>,
  layout: Readonly<{
    position: DockPosition | null;
    size: DockSize | null;
    maximized: boolean;
  }>,
) {
  const { position, size, maximized } = layout;
  useLayoutEffect(() => {
    const style = panelRef.current?.style;
    for (const name of LIVE_STYLES) {
      style?.removeProperty(name === 'maxHeight' ? 'max-height' : name);
    }
  }, [panelRef, position, size, maximized]);
}
