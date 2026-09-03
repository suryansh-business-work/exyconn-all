import { Box, Stack, Typography } from '@exyconn/shell/components/ui';
import { formatMoney } from '@exyconn/shell/utils/money';
import { glass } from '@exyconn/shell/components/glass/glass';
import type { DealStage } from '@exyconn/shell/graphql/generated';
import { DealCard } from './DealCard';
import { stageLabel } from './deals.constants';
import type { DealRow } from './forms/deal';

interface DealColumnProps {
  stage: DealStage;
  accent: string;
  deals: DealRow[];
  onOpen: (deal: DealRow) => void;
  onDropDeal: (dealId: string, stage: DealStage) => void;
}

/**
 * One pipeline stage. It is a drop target for a card dragged from another
 * column, which is the whole point of a board: moving a deal is one gesture
 * rather than opening a form to change one field.
 */
export function DealColumn({
  stage,
  accent,
  deals,
  onOpen,
  onDropDeal,
}: Readonly<DealColumnProps>) {
  const total = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <Box
      sx={[glass, { p: 1.5, minWidth: 240, flex: '1 0 240px' }]}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const id = event.dataTransfer.getData('text/plain');
        if (id) {
          onDropDeal(id, stage);
        }
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ color: accent }}>
          {stageLabel(stage)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {deals.length} · {formatMoney(total)}
        </Typography>
      </Stack>

      {deals.map((deal) => (
        <Box
          key={deal.id}
          draggable
          onDragStart={(event) => event.dataTransfer.setData('text/plain', deal.id)}
        >
          <DealCard deal={deal} accent={accent} onOpen={onOpen} />
        </Box>
      ))}

      {deals.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          Nothing here.
        </Typography>
      )}
    </Box>
  );
}
