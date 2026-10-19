import type { DealStage } from '@exyconn/shell/graphql/generated';

/** Deal ids per stage, top to bottom: what the board shows. */
export type BoardLayout = Partial<Record<DealStage, string[]>>;

/** Where a dragged deal would land: a column and its slot in it, counted from 0. */
export interface DropTarget {
  stage: DealStage;
  index: number;
}

/** A drop target as a person hears it: the column, the slot from 1, and how many slots. */
export interface DropPosition {
  stage: DealStage;
  position: number;
  count: number;
}

interface PlacedDeal {
  id: string;
  stage: DealStage;
}

/**
 * Lays deals out in their columns. A column keeps the order it was last arranged in, so a
 * card dropped mid-column stays where it was put across a reload; a deal the arrangement has
 * not seen yet goes to the bottom in the server's order. A deal's column is its pending move,
 * when one is in flight, else its stage: a failed move falls back to where the deal really is.
 */
export function arrangeBoard(
  deals: readonly PlacedDeal[],
  stages: readonly DealStage[],
  arranged: BoardLayout | null,
  pending: Readonly<Record<string, DealStage>> = {},
): BoardLayout {
  const stageOf = new Map(deals.map((deal) => [deal.id, pending[deal.id] ?? deal.stage]));
  const layout: BoardLayout = {};
  for (const stage of stages) {
    const kept = (arranged?.[stage] ?? []).filter((id) => stageOf.get(id) === stage);
    const placed = new Set(kept);
    const added = deals
      .filter((deal) => stageOf.get(deal.id) === stage && !placed.has(deal.id))
      .map((deal) => deal.id);
    layout[stage] = [...kept, ...added];
  }
  return layout;
}

/** The column a deal sits in, or undefined for one not on the board. */
export function stageOfDeal(layout: BoardLayout, id: string): DealStage | undefined {
  const entry = Object.entries(layout).find(([, ids]) => ids.includes(id));
  return entry?.[0] as DealStage | undefined;
}

const isStage = (layout: BoardLayout, id: string): id is DealStage =>
  Object.keys(layout).includes(id);

/**
 * Where the dragged deal lands when it is over `overId` — a column or another card.
 *
 * Over a card in its own column it takes that card's slot (the cards between shift up or
 * down). Over a card in another column it goes in before it, or after it when the pointer is
 * past the card's middle (`below`). Over a column's empty space it goes to the bottom.
 */
export function dropTarget(
  layout: BoardLayout,
  activeId: string,
  overId: string,
  below = false,
): DropTarget | null {
  if (isStage(layout, overId)) {
    const others = (layout[overId] ?? []).filter((id) => id !== activeId);
    return { stage: overId, index: others.length };
  }
  const stage = stageOfDeal(layout, overId);
  if (stage === undefined) {
    return null;
  }
  const column = layout[stage] ?? [];
  if (column.includes(activeId)) {
    return { stage, index: column.indexOf(overId) };
  }
  return { stage, index: column.indexOf(overId) + (below ? 1 : 0) };
}

/** The layout with `activeId` taken out of its column and put at `target`. */
export function moveDeal(layout: BoardLayout, activeId: string, target: DropTarget): BoardLayout {
  const next: BoardLayout = {};
  for (const [stage, ids] of Object.entries(layout)) {
    next[stage as DealStage] = ids.filter((id) => id !== activeId);
  }
  const column = next[target.stage] ?? [];
  const index = Math.max(0, Math.min(target.index, column.length));
  next[target.stage] = [...column.slice(0, index), activeId, ...column.slice(index)];
  return next;
}

/** The drop target in the words a screen reader says: position 2 of 5 in Proposal. */
export function dropPosition(
  layout: BoardLayout,
  activeId: string,
  overId: string,
): DropPosition | null {
  const target = dropTarget(layout, activeId, overId);
  if (target === null) {
    return null;
  }
  const count = moveDeal(layout, activeId, target)[target.stage]?.length ?? 0;
  return { stage: target.stage, position: target.index + 1, count };
}
