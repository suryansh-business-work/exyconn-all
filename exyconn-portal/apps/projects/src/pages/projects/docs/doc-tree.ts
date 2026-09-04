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
