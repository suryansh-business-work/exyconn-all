import { useLayoutEffect, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { moveDock, resizeDock, type DockPosition, type DockSize } from './commsStore';
import { place } from './useDockDrag';

/** The side of the panel being pulled: its right edge, its bottom edge, or the corner. */
export type ResizeEdge = 'right' | 'bottom' | 'corner';

/** The smallest the panel can be made: the header and a field or two still fit. */
export const MIN_DOCK_SIZE: DockSize = { width: 320, height: 240 };

/** The styles a drag or a resize writes straight on the element. */
const LIVE_STYLES = ['left', 'top', 'right', 'bottom', 'width', 'height', 'maxHeight'] as const;

/** Grows or shrinks one side, never below the minimum nor past the window's edge. */
function clampSide(wanted: number, min: number, room: number) {
  return Math.max(min, Math.min(wanted, room));
}

/**
 * Resizes the dock panel from its right edge, bottom edge or bottom-right corner with pointer
 * events, between {@link MIN_DOCK_SIZE} and the window's edge. The panel is pinned by its
 * top-left corner first, so it grows towards the pointer; the result goes to the store.
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
  const corner: DockPosition = { x: rect.left, y: rect.top };
  const startX = event.clientX;
  const startY = event.clientY;
  const growsWidth = edge !== 'bottom';
  const growsHeight = edge !== 'right';
  let last: DockSize = { width: rect.width, height: rect.height };
  place(panel, corner);
  handle.setPointerCapture(event.pointerId);

  const onMove = (move: PointerEvent) => {
    const roomX = globalThis.innerWidth - rect.left;
    const roomY = globalThis.innerHeight - rect.top;
    last = {
      width: growsWidth
        ? clampSide(rect.width + move.clientX - startX, MIN_DOCK_SIZE.width, roomX)
        : rect.width,
      height: growsHeight
        ? clampSide(rect.height + move.clientY - startY, MIN_DOCK_SIZE.height, roomY)
        : rect.height,
    };
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
