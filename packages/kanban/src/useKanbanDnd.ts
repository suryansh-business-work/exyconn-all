import { useState } from 'react';
import type { Active, DragEndEvent, DragOverEvent, DragStartEvent, Over } from '@dnd-kit/core';
import { columnOf, dropTarget, moveItem, type BoardLayout, type DropTarget } from './kanban.board';

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

interface KanbanDndOptions {
  /** The board as it stands, outside a drag. */
  layout: BoardLayout;
  /** Commits a drop: the item, where it landed, and the column it was picked up from. */
  onDrop: (id: string, target: DropTarget, from: string | undefined) => void;
}

/**
 * The drag state of a board's cards. While a card is carried, `layout` is a preview with the
 * card already in the slot it would land in — the card renders there as the drop placeholder
 * and the cards around it shift to make room. Dropping hands that slot to `onDrop`.
 *
 * Only cards on the board are handled: a drag of anything else (a column, say) is left to the
 * board's own handlers.
 */
export function useKanbanDnd({ layout: settled, onDrop }: Readonly<KanbanDndOptions>) {
  const [preview, setPreview] = useState<BoardLayout | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string | undefined>(undefined);
  const layout = preview ?? settled;
  const isCard = (active: Active) => columnOf(settled, String(active.id)) !== undefined;

  const onDragStart = ({ active }: DragStartEvent) => {
    if (!isCard(active)) {
      return;
    }
    const id = String(active.id);
    setOrigin(columnOf(settled, id));
    setActiveId(id);
    setPreview(settled);
  };

  // Only a move into another column changes the preview: within a column the sortable
  // strategy shifts the cards itself, and the order is taken when the card is dropped.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (activeId === null) {
      return;
    }
    const target = targetOf(layout, active, over);
    if (target && target.column !== columnOf(layout, activeId)) {
      setPreview(moveItem(layout, activeId, target));
    }
  };

  const onDragCancel = () => {
    setActiveId(null);
    setPreview(null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (activeId === null) {
      return;
    }
    const id = activeId;
    const target = targetOf(layout, active, over);
    onDragCancel();
    if (target !== null) {
      onDrop(id, target, origin);
    }
  };

  const targetColumn = activeId === null ? undefined : columnOf(layout, activeId);

  return { layout, activeId, targetColumn, onDragStart, onDragOver, onDragEnd, onDragCancel };
}
