import type { DocPageFieldsFragment } from '@exyconn/shell/graphql/generated';

/** One page and the pages filed under it. */
export interface DocNode {
  page: DocPageFieldsFragment;
  children: DocNode[];
}

/**
 * Turns the flat page list into the tree the sidebar renders.
 *
 * The server returns every page of a space in `order`, flat, because a tree over the wire
 * would have to be re-flattened to move a page anyway. A page whose parent is missing (its
 * parent was deleted in another tab) is treated as top level rather than dropped — a page
 * you cannot see is a page you cannot fix.
 */
export function buildDocTree(pages: readonly DocPageFieldsFragment[]): DocNode[] {
  const nodes = new Map<string, DocNode>(pages.map((page) => [page.id, { page, children: [] }]));
  const roots: DocNode[] = [];

  for (const page of pages) {
    const node = nodes.get(page.id);
    if (!node) continue;
    const parent = page.parentId ? nodes.get(page.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/** Whether `candidateId` sits somewhere under `pageId` — a page cannot be filed under itself. */
export function isDescendant(
  pages: readonly DocPageFieldsFragment[],
  candidateId: string,
  pageId: string,
): boolean {
  const byId = new Map(pages.map((page) => [page.id, page]));
  let current = byId.get(candidateId);
  while (current) {
    if (current.parentId === pageId) {
      return true;
    }
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return false;
}

/**
 * Where a dragged page should land when it is dropped on another page.
 *
 * Two rules, because a tree has two kinds of move. Dropped on a SIBLING, the page reorders to
 * that sibling's position — the list is being sorted. Dropped on a page under a different
 * parent, it is filed under that page instead — the page is being re-homed. A drop on the
 * page itself, or anywhere inside its own subtree, is refused: that would orphan the branch.
 */
export function dropTarget(
  pages: readonly DocPageFieldsFragment[],
  draggedId: string,
  overId: string,
): { parentId: string | null; toIndex: number } | null {
  if (draggedId === overId || isDescendant(pages, overId, draggedId)) {
    return null;
  }
  const byId = new Map(pages.map((page) => [page.id, page]));
  const dragged = byId.get(draggedId);
  const over = byId.get(overId);
  if (!dragged || !over) {
    return null;
  }

  if (dragged.parentId === over.parentId) {
    const siblings = pages.filter((page) => page.parentId === over.parentId);
    return { parentId: over.parentId ?? null, toIndex: siblings.indexOf(over) };
  }

  const children = pages.filter((page) => page.parentId === over.id);
  return { parentId: over.id, toIndex: children.length };
}

/** The ids from a page up to its root, for the breadcrumb above an open page. */
export function trailOf(
  pages: readonly DocPageFieldsFragment[],
  pageId: string,
): DocPageFieldsFragment[] {
  const byId = new Map(pages.map((page) => [page.id, page]));
  const trail: DocPageFieldsFragment[] = [];
  let current = byId.get(pageId);
  while (current) {
    trail.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return trail;
}
