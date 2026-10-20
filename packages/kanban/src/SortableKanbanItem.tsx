import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, IconButton, borderWidth, type Theme } from '@exyconn/ui';

interface SortableKanbanItemProps {
  id: string;
  /** The column the item is in, carried on the drag for the board's handlers. */
  column: string;
  /** The grip's accessible name, already translated: "Drag Acme rollout". */
  dragLabel: string;
  /** Renders the card; place `grip` wherever the card wants its handle. */
  children: (grip: ReactNode) => ReactNode;
}

/**
 * A card on a board that can be carried to another slot or column. Only the grip drags, so a
 * click on the card still opens it. While the card is carried this slot stays where it would
 * land as an outlined, empty placeholder of the card's own height; the card itself follows
 * the pointer in the board's drag overlay.
 */
export function SortableKanbanItem({
  id,
  column,
  dragLabel,
  children,
}: Readonly<SortableKanbanItemProps>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: 'item', column },
  });
  const grip = (
    <IconButton
      size="small"
      aria-label={dragLabel}
      sx={{ cursor: 'grab', touchAction: 'none' }}
      {...attributes}
      {...listeners}
    >
      <DragIndicatorIcon fontSize="small" />
    </IconButton>
  );

  return (
    <Box
      ref={setNodeRef}
      data-testid={isDragging ? 'kanban-drop-placeholder' : undefined}
      sx={{
        transform: CSS.Transform.toString(transform),
        transition,
        // An outline, not a border, so the placeholder is exactly the card's size.
        ...(isDragging && {
          borderRadius: 1,
          outline: (theme: Theme) => `${borderWidth.thick}px dashed ${theme.palette.primary.main}`,
          outlineOffset: -borderWidth.thick,
          bgcolor: 'action.hover',
        }),
      }}
    >
      {/* The content keeps the slot exactly as tall as the card, and is hidden from everyone. */}
      <Box
        aria-hidden={isDragging || undefined}
        sx={{ visibility: isDragging ? 'hidden' : 'visible' }}
      >
        {children(grip)}
      </Box>
    </Box>
  );
}
