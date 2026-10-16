import { foldText as fold } from '@/utils/foldText';
import type { PageSideNavGroup, PageSideNavItem } from './pageSideNav.types';

/** Translates an English source into what the reader sees. */
type Translate = (source: string) => string;

/**
 * The entries whose name or category — as the reader sees them, translated — contains what was
 * typed. An empty search keeps every entry.
 */
export function filterNavItems(
  items: readonly PageSideNavItem[],
  query: string,
  translate: Translate,
): PageSideNavItem[] {
  const wanted = fold(query.trim());
  if (wanted === '') {
    return [...items];
  }
  return items.filter(
    (item) =>
      fold(translate(item.label)).includes(wanted) ||
      fold(translate(item.category)).includes(wanted),
  );
}

/** Entries under their category, groups in the order their first entry appears. */
export function groupNavItems(items: readonly PageSideNavItem[]): PageSideNavGroup[] {
  const groups = new Map<string, PageSideNavItem[]>();
  for (const item of items) {
    const members = groups.get(item.category);
    if (members) {
      members.push(item);
    } else {
      groups.set(item.category, [item]);
    }
  }
  return Array.from(groups, ([category, members]) => ({ category, items: members }));
}

/** A sorted copy by translated name, A→Z or Z→A. */
export function sortNavItems(
  items: readonly PageSideNavItem[],
  direction: 'asc' | 'desc',
  translate: Translate,
): PageSideNavItem[] {
  const sign = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => sign * translate(a.label).localeCompare(translate(b.label)));
}
