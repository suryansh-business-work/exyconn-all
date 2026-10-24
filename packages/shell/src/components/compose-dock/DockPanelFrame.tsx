import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Box, Paper, portalShadow, useMediaQuery, useTheme } from '@/components/ui';
import {
  dockFocusTaken,
  maximizeDock,
  type DockPanel,
  type DockPosition,
  type DockSize,
} from './dockStore';
import { DockPanelHeader } from './DockPanelHeader';
import { DockResizeHandles } from './DockResizeHandles';
import { dockPlacement } from './dockPlacement';
import { useDockDrag } from './useDockDrag';
import { useClearLiveStyles } from './useDockResize';

/** The first field (or button) in the panel's body, where focus lands on open. */
const FIRST_CONTROL =
  'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), [role="combobox"], button:not([disabled])';

interface DockPanelFrameProps {
  panel: Pick<DockPanel, 'key' | 'focusPending'>;
  title: string;
  position: DockPosition | null;
  size: DockSize | null;
  maximized: boolean;
  /** Lifts the default spot above the row of minimized panels. */
  abovePills: boolean;
  onMinimize: () => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * A floating, non-modal window: no backdrop, the page behind stays usable. Drag it by the header
 * and resize it from its right and bottom edges (on a phone it fills the bottom of the screen
 * instead); maximize fills the screen, a double-click on the header too. Escape minimizes it.
 */
export function DockPanelFrame({
  panel,
  title,
  position,
  size,
  maximized,
  abovePills,
  onMinimize,
  onClose,
  children,
}: Readonly<DockPanelFrameProps>) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const movable = !isPhone && !maximized;
  const drag = useDockDrag(panelRef, movable);
  useClearLiveStyles(panelRef, { position, size, maximized });

  useEffect(() => {
    if (!panel.focusPending) {
      return;
    }
    const first = bodyRef.current?.querySelector<HTMLElement>(FIRST_CONTROL);
    (first ?? panelRef.current)?.focus();
    dockFocusTaken(panel.key);
  }, [panel.focusPending, panel.key]);

  // Escape minimizes. Listened for natively: the dialog itself is not an interactive element.
  useEffect(() => {
    const element = panelRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onMinimize();
      }
    };
    element?.addEventListener('keydown', onKeyDown);
    return () => element?.removeEventListener('keydown', onKeyDown);
  }, [onMinimize]);

  return (
    <Paper
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      sx={{
        position: 'fixed',
        ...dockPlacement({ theme, isPhone, maximized, position, size, abovePills }),
        zIndex: theme.zIndex.drawer + 1,
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        borderColor: 'divider',
        boxShadow: portalShadow[theme.palette.mode].lg,
      }}
    >
      <DockPanelHeader
        title={title}
        titleId={titleId}
        draggable={movable}
        maximized={maximized}
        onDragStart={drag.onPointerDown}
        onToggleMaximize={() => maximizeDock(!maximized)}
        onMinimize={onMinimize}
        onClose={onClose}
      />
      <Box ref={bodyRef} sx={{ p: 2, overflowY: 'auto', flexGrow: 1, minHeight: 0 }}>
        {children}
      </Box>
      {movable && <DockResizeHandles panelRef={panelRef} />}
    </Paper>
  );
}
