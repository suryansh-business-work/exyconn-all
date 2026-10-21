import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import type { Logger } from '@exyconn/logger';
import { saveLayout } from '../../hooks/useLayout';
import type { PanelLayout } from '../../storage/layout';
import type { IconCorner } from '../../storage/prefs';
import {
  clampPosition,
  cornerPosition,
  moveByKey,
  type Point,
  type Size,
} from '../../utils/floating-position';
import { logTo } from '../../services/logger';

/** A pointer that moves less than this between down and up is a click, not a drag. */
const DRAG_THRESHOLD = 4;

const viewport = (): Size => ({ width: globalThis.innerWidth, height: globalThis.innerHeight });

interface Drag {
  start: Point;
  origin: Point;
  moved: boolean;
}

/**
 * The floating icon's position: the saved spot or the chosen corner, draggable with a
 * pointer and movable with the arrow keys, kept above Meet's controls, saved when it stops.
 */
export function useFloatingPosition(
  layout: PanelLayout,
  corner: IconCorner,
  icon: Size,
  logger: Logger,
) {
  const [point, setPoint] = useState<Point>(() =>
    layout.iconOffset === null
      ? cornerPosition(corner, icon, viewport())
      : clampPosition(layout.iconOffset, icon, viewport()),
  );
  const drag = useRef<Drag | null>(null);

  useEffect(() => {
    setPoint(
      layout.iconOffset === null
        ? cornerPosition(corner, icon, viewport())
        : clampPosition(layout.iconOffset, icon, viewport()),
    );
  }, [layout.iconOffset, corner, icon]);

  useEffect(() => {
    const onResize = (): void => setPoint((current) => clampPosition(current, icon, viewport()));
    globalThis.addEventListener('resize', onResize);
    return () => globalThis.removeEventListener('resize', onResize);
  }, [icon]);

  const persist = useCallback(
    (next: Point) => {
      saveLayout({ ...layout, iconOffset: next }).catch(
        logTo(logger, 'Could not save the icon position'),
      );
    },
    [layout, logger],
  );

  const onPointerDown = (event: PointerEvent<HTMLElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { start: { x: event.clientX, y: event.clientY }, origin: point, moved: false };
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>): void => {
    const current = drag.current;
    if (current === null) {
      return;
    }
    const dx = event.clientX - current.start.x;
    const dy = event.clientY - current.start.y;
    current.moved ||= Math.hypot(dx, dy) >= DRAG_THRESHOLD;
    if (current.moved) {
      setPoint(
        clampPosition({ x: current.origin.x + dx, y: current.origin.y + dy }, icon, viewport()),
      );
    }
  };
  /** Ends a drag; true when it was a real drag (so the click that follows is swallowed). */
  const endDrag = (): boolean => {
    const moved = drag.current?.moved ?? false;
    drag.current = null;
    if (moved) {
      persist(point);
    }
    return moved;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    const next = moveByKey(point, event.key, event.shiftKey, icon, viewport());
    if (next !== null) {
      event.preventDefault();
      setPoint(next);
      persist(next);
    }
  };

  return { point, onPointerDown, onPointerMove, endDrag, onKeyDown };
}
