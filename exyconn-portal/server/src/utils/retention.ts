/**
 * The items a "keep the newest N" rule lets go, from a list sorted newest first: everything past
 * the first `keep`, except the newest item of each group. A group is what people install from —
 * a platform (tracker builds), a release channel (extension builds) — so deleting its newest item
 * would leave it with nothing to download or update to. `keep` of 0 or less keeps everything.
 */
export function beyondRetention<T>(
  items: readonly T[],
  keep: number,
  groupsOf: (item: T) => readonly string[],
): T[] {
  if (keep <= 0) {
    return [];
  }
  const claimed = new Set<string>();
  const newestOfAGroup = new Set<T>();
  for (const item of items) {
    const groups = groupsOf(item);
    if (groups.some((group) => !claimed.has(group))) {
      newestOfAGroup.add(item);
    }
    for (const group of groups) {
      claimed.add(group);
    }
  }
  return items.slice(keep).filter((item) => !newestOfAGroup.has(item));
}
