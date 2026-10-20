import { useRef, useState, type PointerEvent } from 'react';

export type ComposeSize = 'normal' | 'minimized' | 'maximized';

/** How far the window has been dragged from its docked corner, in pixels. */
interface Offset {
  x: number;
  y: number;
}

/**
 * The compose window's size and position. It docks bottom-right; dragging its title bar moves
 * it, and minimising or maximising puts it back in the corner so it is never lost off-screen.
 */
export function useComposeWindow() {
  const [size, setSize] = useState<ComposeSize>('normal');
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const drag = useRef<{ start: Offset; origin: Offset } | null>(null);

  const resize = (next: ComposeSize) => {
    setSize(next);
    setOffset({ x: 0, y: 0 });
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    // Only the plain title bar drags — a press on its buttons is a click.
    if (size !== 'normal' || (event.target as HTMLElement).closest('button')) {
      return;
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { start: { x: event.clientX, y: event.clientY }, origin: offset };
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (current) {
      setOffset({
        x: current.origin.x + event.clientX - current.start.x,
        y: Math.min(0, current.origin.y + event.clientY - current.start.y),
      });
    }
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  return { size, offset, resize, dragHandlers: { onPointerDown, onPointerMove, onPointerUp } };
}
