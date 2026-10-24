import type { RefObject } from 'react';
import { Box, useTheme } from '@/components/ui';
import { startDockResize, type ResizeEdge } from './useDockResize';

interface HandleSpec {
  edge: ResizeEdge;
  cursor: string;
  /** Where the strip sits on the panel's edge. */
  area: Record<string, string | number>;
}

interface DockResizeHandlesProps {
  panelRef: RefObject<HTMLElement | null>;
}

/**
 * Invisible grab strips on all four edges of the panel and its top-left and bottom-right corners.
 * They are pointer-only (hidden from assistive tech): the maximize button is the keyboard way
 * to make the panel bigger.
 */
export function DockResizeHandles({ panelRef }: Readonly<DockResizeHandlesProps>) {
  const theme = useTheme();
  const grip = theme.spacing(1);
  const corner = theme.spacing(2);
  const handles: HandleSpec[] = [
    { edge: 'left', cursor: 'ew-resize', area: { top: corner, left: 0, bottom: 0, width: grip } },
    { edge: 'top', cursor: 'ns-resize', area: { top: 0, left: corner, right: 0, height: grip } },
    {
      edge: 'top-left',
      cursor: 'nwse-resize',
      area: { top: 0, left: 0, width: corner, height: corner },
    },
    { edge: 'right', cursor: 'ew-resize', area: { top: 0, right: 0, bottom: corner, width: grip } },
    {
      edge: 'bottom',
      cursor: 'ns-resize',
      area: { left: 0, right: corner, bottom: 0, height: grip },
    },
    {
      edge: 'corner',
      cursor: 'nwse-resize',
      area: { right: 0, bottom: 0, width: corner, height: corner },
    },
  ];

  return handles.map(({ edge, cursor, area }) => (
    <Box
      key={edge}
      aria-hidden
      data-resize-edge={edge}
      onPointerDown={(event) => startDockResize(panelRef.current, edge, event)}
      sx={{ position: 'absolute', ...area, cursor, touchAction: 'none', zIndex: 1 }}
    />
  ));
}
