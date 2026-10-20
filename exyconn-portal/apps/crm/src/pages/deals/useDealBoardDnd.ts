import { useMemo, useState } from 'react';
import {
  arrangeBoard,
  moveItem,
  useKanbanDnd,
  useKanbanSensors,
  type BoardLayout,
  type DropTarget,
} from '@exyconn/kanban';
import type { DealStage } from '@exyconn/shell/graphql/generated';
import { PIPELINE_STAGES } from './deals.constants';
import { useDealAnnouncements } from './useDealAnnouncements';
import type { DealRow } from './forms/deal';

function withoutKey<T>(record: Readonly<Record<string, T>>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([name]) => name !== key));
}

/**
 * The deals board's drag state, on the shared kanban drag. The server keeps a deal's stage,
 * not its slot, so the order a person arranged is kept here; dropping in another stage
 * persists the stage through `onMove`, holding the card there until the save settles.
 */
export function useDealBoardDnd(
  deals: readonly DealRow[],
  onMove: (dealId: string, stage: DealStage) => Promise<void>,
) {
  const [arranged, setArranged] = useState<BoardLayout | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});

  const settled = useMemo(
    () =>
      arrangeBoard(
        deals.map((deal) => ({ id: deal.id, column: deal.stage })),
        PIPELINE_STAGES,
        arranged,
        pending,
      ),
    [deals, arranged, pending],
  );

  const commitStage = async (dealId: string, stage: DealStage) => {
    setPending((current) => ({ ...current, [dealId]: stage }));
    try {
      // onMove reports its own failure; clearing the pending move puts the card back.
      await onMove(dealId, stage);
    } finally {
      setPending((current) => withoutKey(current, dealId));
    }
  };

  const onDrop = (id: string, target: DropTarget, from: string | undefined) => {
    setArranged(moveItem(settled, id, target));
    if (target.column !== from) {
      commitStage(id, target.column as DealStage).catch(() => undefined);
    }
  };

  const drag = useKanbanDnd({ layout: settled, onDrop });
  const sensors = useKanbanSensors();
  const accessibility = useDealAnnouncements(drag.layout, deals);
  const activeDeal = deals.find((deal) => deal.id === drag.activeId) ?? null;

  return {
    layout: drag.layout,
    activeDeal,
    targetStage: drag.targetColumn as DealStage | undefined,
    sensors,
    accessibility,
    onDragStart: drag.onDragStart,
    onDragOver: drag.onDragOver,
    onDragEnd: drag.onDragEnd,
    onDragCancel: drag.onDragCancel,
  };
}
