import type { IconCorner } from '../storage/prefs';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Gap kept between the icon and the window edge. */
export const EDGE_GAP = 16;
/**
 * Height kept clear at the bottom for Meet's call controls (mic, camera, share, leave), so
 * the icon can never be dropped on top of them.
 */
export const CONTROL_BAR_CLEARANCE = 96;
/** One arrow-key press moves the icon this far; with Shift, four times as far. */
export const KEY_STEP = 8;

/** Keeps the icon inside the window and above Meet's control bar. */
export function clampPosition(point: Point, icon: Size, viewport: Size): Point {
  const maxX = Math.max(EDGE_GAP, viewport.width - icon.width - EDGE_GAP);
  const maxY = Math.max(EDGE_GAP, viewport.height - icon.height - CONTROL_BAR_CLEARANCE);
  return {
    x: Math.round(Math.min(maxX, Math.max(EDGE_GAP, point.x))),
    y: Math.round(Math.min(maxY, Math.max(EDGE_GAP, point.y))),
  };
}

/** Where the icon sits for a corner preference, before the user has moved it. */
export function cornerPosition(corner: IconCorner, icon: Size, viewport: Size): Point {
  const left = corner.endsWith('left');
  const top = corner.startsWith('top');
  const x = left ? EDGE_GAP : viewport.width - icon.width - EDGE_GAP;
  const y = top ? EDGE_GAP : viewport.height - icon.height - CONTROL_BAR_CLEARANCE;
  return clampPosition({ x, y }, icon, viewport);
}

const ARROWS: Readonly<Record<string, Point>> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

/** The position after an arrow key, or null for any other key. */
export function moveByKey(
  point: Point,
  key: string,
  large: boolean,
  icon: Size,
  viewport: Size,
): Point | null {
  const direction = ARROWS[key];
  if (direction === undefined) {
    return null;
  }
  const step = large ? KEY_STEP * 4 : KEY_STEP;
  return clampPosition(
    { x: point.x + direction.x * step, y: point.y + direction.y * step },
    icon,
    viewport,
  );
}
