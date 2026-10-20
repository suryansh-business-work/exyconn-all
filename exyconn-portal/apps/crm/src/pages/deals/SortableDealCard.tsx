import { useT } from '@exyconn/i18n';
import { SortableKanbanItem } from '@exyconn/kanban';
import { Box, Stack } from '@exyconn/shell/components/ui';
import type { DealStage } from '@exyconn/shell/graphql/generated';
import { DealCard } from './DealCard';
import type { DealRow } from './forms/deal';

interface SortableDealCardProps {
  deal: DealRow;
  stage: DealStage;
  accent: string;
  onOpen: (deal: DealRow) => void;
}

/** A deal on the board that can be carried to another slot or stage, by its grip. */
export function SortableDealCard({ deal, stage, accent, onOpen }: Readonly<SortableDealCardProps>) {
  const t = useT();
  return (
    <Box sx={{ mb: 1 }}>
      <SortableKanbanItem
        id={deal.id}
        column={stage}
        dragLabel={t('Drag {title}', { title: deal.title })}
      >
        {(grip) => (
          <Stack direction="row" sx={{ alignItems: 'flex-start', '& > button': { mt: 0.5 } }}>
            {grip}
            <Box sx={{ flex: 1, minWidth: 0, '& > button': { mb: 0 } }}>
              <DealCard deal={deal} accent={accent} onOpen={onOpen} />
            </Box>
          </Stack>
        )}
      </SortableKanbanItem>
    </Box>
  );
}
