import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useT } from '@exyconn/i18n';
import { dropTargetRing } from '@exyconn/kanban';
import { Box, Stack, Typography, readableAccent, transition } from '@exyconn/shell/components/ui';
import { formatMoney } from '@exyconn/shell/utils/money';
import { panel } from '@exyconn/shell/components/glass/glass';
import type { DealStage } from '@exyconn/shell/graphql/generated';
import { SortableDealCard } from './SortableDealCard';
import { stageLabel } from './deals.constants';
import type { DealRow } from './forms/deal';

interface DealColumnProps {
  stage: DealStage;
  accent: string;
  deals: DealRow[];
  /** The column a carried card would land in: it lights up so the target is never a guess. */
  highlighted?: boolean;
  onOpen: (deal: DealRow) => void;
}

/**
 * One pipeline stage: a drop target for a card carried from any column, and a sorted list
 * its own cards can be reordered in. Moving a deal is one gesture rather than a form.
 */
export function DealColumn({
  stage,
  accent,
  deals,
  highlighted = false,
  onOpen,
}: Readonly<DealColumnProps>) {
  const t = useT();
  const { setNodeRef } = useDroppable({ id: stage, data: { type: 'column' } });
  const total = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <Box
      ref={setNodeRef}
      data-drop-target={highlighted || undefined}
      sx={[
        panel,
        { minWidth: 240, flex: '1 0 240px', transition: transition.surface },
        highlighted && dropTargetRing(accent),
      ]}
    >
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'baseline',
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" sx={(theme) => ({ color: readableAccent(accent, theme) })}>
          {t(stageLabel(stage))}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {deals.length} · {formatMoney(total)}
        </Typography>
      </Stack>

      <SortableContext items={deals.map((deal) => deal.id)} strategy={verticalListSortingStrategy}>
        {deals.map((deal) => (
          <SortableDealCard
            key={deal.id}
            deal={deal}
            stage={stage}
            accent={accent}
            onOpen={onOpen}
          />
        ))}
      </SortableContext>

      {deals.length === 0 && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {t('Nothing here.')}
        </Typography>
      )}
    </Box>
  );
}
