import { useEffect, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { moveDock, resizeDock, type DockPosition } from './commsStore';

/** Keeps the whole panel on screen. */
function clamp(position: DockPosition, width: number, height: number): DockPosition {
  const maxX = Math.max(0, globalThis.innerWidth - width);
  const maxY = Math.max(0, globalThis.innerHeight - height);
  return {
    x: Math.min(Math.max(0, position.x), maxX),
    y: Math.min(Math.max(0, position.y), maxY),
  };
}

/** Moves the panel straight on the element while dragging, so the form does not re-render. */
export function place(panel: HTMLElement, position: DockPosition) {
  panel.style.left = `${position.x}px`;
  panel.style.top = `${position.y}px`;
  panel.style.right = 'auto';
  panel.style.bottom = 'auto';
}

/**
 * Drags the dock panel by its header with pointer events (mouse, pen and touch), clamped to
 * the viewport; the final spot goes to the store. Presses on the header's buttons are left to
 * them. A window resize puts the panel back in its corner at its default size, so it cannot end
 * up off screen.
 */
export function useDockDrag(panelRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const reset = () => {
      moveDock(null);
      resizeDock(null);
    };
    globalThis.addEventListener('resize', reset);
    return () => globalThis.removeEventListener('resize', reset);
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const panel = panelRef.current;
    const pressedButton = (event.target as HTMLElement).closest('button');
    if (!enabled || !panel || event.button !== 0 || pressedButton) {
      return;
    }
    const handle = event.currentTarget;
    const rect = panel.getBoundingClientRect();
    const grabX = event.clientX - rect.left;
    const grabY = event.clientY - rect.top;
    let last = clamp({ x: rect.left, y: rect.top }, rect.width, rect.height);
    handle.setPointerCapture(event.pointerId);

    const onMove = (move: PointerEvent) => {
      last = clamp({ x: move.clientX - grabX, y: move.clientY - grabY }, rect.width, rect.height);
      place(panel, last);
    };
    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
      moveDock(last);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  };

  return { onPointerDown };
}
