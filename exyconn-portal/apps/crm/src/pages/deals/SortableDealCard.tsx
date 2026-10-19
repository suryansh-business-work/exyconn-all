import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useT } from '@exyconn/i18n';
import { Box, IconButton, Stack, borderWidth, type Theme } from '@exyconn/shell/components/ui';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import type { DealStage } from '@exyconn/shell/graphql/generated';
import { DealCard } from './DealCard';
import type { DealRow } from './forms/deal';

interface SortableDealCardProps {
  deal: DealRow;
  stage: DealStage;
  accent: string;
  onOpen: (deal: DealRow) => void;
}

/**
 * A deal on the board that can be carried to another slot or stage. Only the grip drags,
 * so a click on the card still opens it. While the deal is being carried this slot stays
 * where it would land as an outlined, empty placeholder of the card's own height; the card
 * itself follows the pointer in the board's drag overlay.
 */
export function SortableDealCard({ deal, stage, accent, onOpen }: Readonly<SortableDealCardProps>) {
  const t = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { type: 'deal', stage },
  });

  return (
    <Box
      ref={setNodeRef}
      data-testid={isDragging ? 'deal-drop-placeholder' : undefined}
      sx={{
        mb: 1,
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
      <Stack
        direction="row"
        aria-hidden={isDragging || undefined}
        sx={{ alignItems: 'flex-start', visibility: isDragging ? 'hidden' : 'visible' }}
      >
        <IconButton
          size="small"
          aria-label={t('Drag {title}', { title: deal.title })}
          sx={{ cursor: 'grab', mt: 0.5, touchAction: 'none' }}
          {...attributes}
          {...listeners}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0, '& > button': { mb: 0 } }}>
          <DealCard deal={deal} accent={accent} onOpen={onOpen} />
        </Box>
      </Stack>
    </Box>
  );
}
