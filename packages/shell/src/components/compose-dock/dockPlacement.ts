import type { Theme } from '@/components/ui';
import type { DockPosition, DockSize } from './dockStore';

interface PlacementInput {
  theme: Theme;
  isPhone: boolean;
  maximized: boolean;
  position: DockPosition | null;
  size: DockSize | null;
  /** Lifts the default spot above the row of minimized panels. */
  abovePills: boolean;
}

/** Where the panel sits on screen: maximized, the phone's bottom sheet, dragged, or its corner. */
function spotOf({ theme, isPhone, maximized, position, abovePills }: PlacementInput) {
  if (maximized) {
    const inset = theme.spacing(1);
    return { top: inset, right: inset, bottom: inset, left: inset };
  }
  if (isPhone) {
    return { left: 0, right: 0, bottom: 0 };
  }
  if (position) {
    return { left: position.x, top: position.y };
  }
  return { right: theme.spacing(2), bottom: theme.spacing(abovePills ? 8 : 2) };
}

/** How big the panel is: the whole screen, the size it was resized to, or its default. */
function boxOf({ theme, isPhone, maximized, size }: PlacementInput) {
  if (maximized) {
    return { width: 'auto', height: 'auto', maxHeight: 'none' };
  }
  if (size && !isPhone) {
    return { width: `${size.width}px`, height: `${size.height}px`, maxHeight: 'none' };
  }
  return {
    width: { xs: '100%', sm: theme.spacing(52) },
    maxHeight: { xs: '85vh', sm: `calc(100vh - ${theme.spacing(12)})` },
  };
}

/** The dock panel's position and size styles. */
export function dockPlacement(input: Readonly<PlacementInput>) {
  return { ...spotOf(input), ...boxOf(input) };
}
