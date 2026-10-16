import { foldText as fold } from '@exyconn/shell/utils/foldText';
import type { TabberItem } from './tabber.types';

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
