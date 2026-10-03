import type { TabberItem } from './tabber.types';

/** Lower case with accents dropped, so "resume" finds "Résumé". */
const fold = (text: string): string =>
  text
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase();

/**
 * The tabs whose name — as the reader sees it, translated — contains what was typed. An empty
 * search keeps every tab.
 */
export function filterTabs(
  items: readonly TabberItem[],
  query: string,
  label: (item: TabberItem) => string,
): TabberItem[] {
  const wanted = fold(query.trim());
  if (wanted === '') {
    return [...items];
  }
  return items.filter((item) => fold(label(item)).includes(wanted));
}
