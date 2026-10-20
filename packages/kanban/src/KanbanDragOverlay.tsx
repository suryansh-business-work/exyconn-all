import type { ReactNode } from 'react';
import { DragOverlay } from '@dnd-kit/core';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, portalShadow } from '@exyconn/ui';

/** The grip as it shows on the lifted card: a picture of the handle, not a control. */
export const overlayGrip = (
  <Box sx={{ display: 'flex', p: 0.5, color: 'action.active' }}>
    <DragIndicatorIcon fontSize="small" />
  </Box>
);

/**
 * The card in hand: it follows the pointer above the board, raised on the largest shadow so
 * it reads as lifted off the page. It is a copy of the card, so it is inert — the original
 * slot, shown as the drop placeholder, is the one assistive tech follows.
 */
export function KanbanDragOverlay({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <DragOverlay>
      {children ? (
        <Box
          inert
          data-testid="kanban-drag-overlay"
          sx={(theme) => ({
            borderRadius: 1,
            cursor: 'grabbing',
            boxShadow: portalShadow[theme.palette.mode].xl,
          })}
        >
          {children}
        </Box>
      ) : null}
    </DragOverlay>
  );
}
