import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { Stack } from '@exyconn/shell/components/ui';
import type { DealStage } from '@exyconn/shell/graphql/generated';
import { DealCard } from './DealCard';
import { DealColumn } from './DealColumn';
import { PIPELINE_STAGES, STAGE_ACCENTS } from './deals.constants';
import { useDealBoardDnd } from './useDealBoardDnd';
import type { DealRow } from './forms/deal';

interface DealBoardProps {
  deals: readonly DealRow[];
  onOpen: (deal: DealRow) => void;
  /** Persists a stage change. It reports its own failure; the card then goes back. */
  onMove: (dealId: string, stage: DealStage) => Promise<void>;
}

/**
 * The pipeline columns and the drag that moves deals between them. While a card is carried
 * it follows the pointer in the overlay, its slot shows where it will land, and the target
 * column lights up; the keyboard (Space, arrows, Space) does the same with announcements.
 */
export function DealBoard({ deals, onOpen, onMove }: Readonly<DealBoardProps>) {
  const board = useDealBoardDnd(deals, onMove);
  const byId = new Map(deals.map((deal) => [deal.id, deal]));
  const dealsIn = (stage: DealStage) =>
    (board.layout[stage] ?? []).flatMap((id) => byId.get(id) ?? []);

  return (
    <DndContext
      sensors={board.sensors}
      collisionDetection={closestCorners}
      accessibility={board.accessibility}
      onDragStart={board.onDragStart}
      onDragOver={board.onDragOver}
      onDragEnd={board.onDragEnd}
      onDragCancel={board.onDragCancel}
    >
      <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1 }}>
        {PIPELINE_STAGES.map((stage) => (
          <DealColumn
            key={stage}
            stage={stage}
            accent={STAGE_ACCENTS[stage]}
            deals={dealsIn(stage)}
            highlighted={board.targetStage === stage}
            onOpen={onOpen}
          />
        ))}
      </Stack>
      <DragOverlay>
        {board.activeDeal ? (
          <DealCard
            deal={board.activeDeal}
            accent={STAGE_ACCENTS[board.targetStage ?? board.activeDeal.stage]}
            onOpen={onOpen}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
