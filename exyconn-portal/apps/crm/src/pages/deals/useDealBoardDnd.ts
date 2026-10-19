import { useMemo, useRef, useState } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Active,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Over,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { DealStage } from '@exyconn/shell/graphql/generated';
import {
  arrangeBoard,
  dropTarget,
  moveDeal,
  stageOfDeal,
  type BoardLayout,
  type DropTarget,
} from './deals.board';
import { PIPELINE_STAGES } from './deals.constants';
import { useDealAnnouncements } from './useDealAnnouncements';
import type { DealRow } from './forms/deal';

/** Whether the dragged card's top has passed the middle of the card it is over. */
export function isBelow(active: Active, over: Over): boolean {
  const dragged = active.rect.current.translated;
  return dragged !== null && dragged.top > over.rect.top + over.rect.height / 2;
}

function targetOf(layout: BoardLayout, active: Active, over: Over | null): DropTarget | null {
  return over
    ? dropTarget(layout, String(active.id), String(over.id), isBelow(active, over))
    : null;
}

function withoutKey<T>(record: Readonly<Record<string, T>>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([name]) => name !== key));
}

/**
 * The board's drag state. While a card is carried, `layout` is a preview with the card
 * already in the slot it would land in — the card itself renders there as the drop
 * placeholder, and the cards around it shift to make room. Dropping keeps that arrangement
 * and, when the stage changed, persists the stage through `onMove`.
 */
export function useDealBoardDnd(
  deals: readonly DealRow[],
  onMove: (dealId: string, stage: DealStage) => Promise<void>,
) {
  const [arranged, setArranged] = useState<BoardLayout | null>(null);
  const [pending, setPending] = useState<Record<string, DealStage>>({});
  const [preview, setPreview] = useState<BoardLayout | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const origin = useRef<DealStage | undefined>(undefined);

  const settled = useMemo(
    () => arrangeBoard(deals, PIPELINE_STAGES, arranged, pending),
    [deals, arranged, pending],
  );
  const layout = preview ?? settled;
  const accessibility = useDealAnnouncements(layout, deals);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // A finger holds before it drags, or the board's sideways scroll would pick cards up.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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

  const onDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id);
    origin.current = stageOfDeal(settled, id);
    setActiveId(id);
    setPreview(settled);
  };

  // Only a move into another column changes the preview: within a column the sortable
  // strategy shifts the cards itself, and the order is taken when the card is dropped.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    const target = targetOf(layout, active, over);
    if (target && target.stage !== stageOfDeal(layout, String(active.id))) {
      setPreview(moveDeal(layout, String(active.id), target));
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id);
    const target = targetOf(layout, active, over);
    setActiveId(null);
    setPreview(null);
    if (target === null) {
      return;
    }
    setArranged(moveDeal(layout, id, target));
    if (target.stage !== origin.current) {
      commitStage(id, target.stage).catch(() => undefined);
    }
  };

  const onDragCancel = () => {
    setActiveId(null);
    setPreview(null);
  };

  const targetStage = activeId === null ? undefined : stageOfDeal(layout, activeId);
  const activeDeal = deals.find((deal) => deal.id === activeId) ?? null;

  return {
    layout,
    activeDeal,
    targetStage,
    sensors,
    accessibility,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
  };
}
