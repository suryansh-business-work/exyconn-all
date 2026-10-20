/** Item ids per column, top to bottom: what the board shows. */
export type BoardLayout = Record<string, string[]>;

/** Where a dragged item would land: a column and its slot in it, counted from 0. */
export interface DropTarget {
  column: string;
  index: number;
}

/** A drop target as a person hears it: the column, the slot from 1, and how many slots. */
export interface DropPosition {
  column: string;
  position: number;
  count: number;
}

/** An item and the column it belongs in. */
export interface PlacedItem {
  id: string;
  column: string;
}

/**
 * Lays items out in their columns. A column keeps the order it was last arranged in, so an
 * item dropped mid-column stays where it was put; an item the arrangement has not seen yet
 * goes to the bottom in the given order. An item's column is its pending move, when one is in
 * flight, else its own: a failed move falls back to where the item really is.
 */
export function arrangeBoard(
  items: readonly PlacedItem[],
  columns: readonly string[],
  arranged: BoardLayout | null = null,
  pending: Readonly<Record<string, string>> = {},
): BoardLayout {
  const columnOfItem = new Map(items.map((item) => [item.id, pending[item.id] ?? item.column]));
  const layout: BoardLayout = {};
  for (const column of columns) {
    const kept = (arranged?.[column] ?? []).filter((id) => columnOfItem.get(id) === column);
    const placed = new Set(kept);
    const added = items
      .filter((item) => columnOfItem.get(item.id) === column && !placed.has(item.id))
      .map((item) => item.id);
    layout[column] = [...kept, ...added];
  }
  return layout;
}

/** The column an item sits in, or undefined for one not on the board. */
export function columnOf(layout: BoardLayout, id: string): string | undefined {
  return Object.entries(layout).find(([, ids]) => ids.includes(id))?.[0];
}

/**
 * Where the dragged item lands when it is over `overId` — a column or another item.
 *
 * Over an item in its own column it takes that item's slot (the items between shift up or
 * down). Over an item in another column it goes in before it, or after it when the pointer is
 * past the item's middle (`below`). Over a column's empty space it goes to the bottom.
 */
export function dropTarget(
  layout: BoardLayout,
  activeId: string,
  overId: string,
  below = false,
): DropTarget | null {
  if (Object.keys(layout).includes(overId)) {
    const others = layout[overId].filter((id) => id !== activeId);
    return { column: overId, index: others.length };
  }
  const column = columnOf(layout, overId);
  if (column === undefined) {
    return null;
  }
  const ids = layout[column];
  if (ids.includes(activeId)) {
    return { column, index: ids.indexOf(overId) };
  }
  return { column, index: ids.indexOf(overId) + (below ? 1 : 0) };
}

/** The layout with `activeId` taken out of its column and put at `target`. */
export function moveItem(layout: BoardLayout, activeId: string, target: DropTarget): BoardLayout {
  const next: BoardLayout = {};
  for (const [column, ids] of Object.entries(layout)) {
    next[column] = ids.filter((id) => id !== activeId);
  }
  const ids = next[target.column] ?? [];
  const index = Math.max(0, Math.min(target.index, ids.length));
  next[target.column] = [...ids.slice(0, index), activeId, ...ids.slice(index)];
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
  const count = moveItem(layout, activeId, target)[target.column].length;
  return { column: target.column, position: target.index + 1, count };
}
