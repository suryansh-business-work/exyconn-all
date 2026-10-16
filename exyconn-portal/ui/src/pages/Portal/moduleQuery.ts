import type { ModuleDefinition } from '@exyconn/shell/config/modules';

/** How the launcher orders its cards: the role model's own order, or by name. */
export type ModuleSort = 'default' | 'name-asc' | 'name-desc';

export const MODULE_SORTS: readonly { value: ModuleSort; label: string }[] = [
  { value: 'default', label: 'Recommended' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
];

const SORT_VALUES: ReadonlySet<string> = new Set(MODULE_SORTS.map((sort) => sort.value));

export function isModuleSort(value: string): value is ModuleSort {
  return SORT_VALUES.has(value);
}

/**
 * The modules matching the search (on the name or the description, as the person reads them)
 * in the chosen order. `read` is the translator, so a search matches the words on screen.
 */
export function visibleModules(
  modules: readonly ModuleDefinition[],
  search: string,
  sort: ModuleSort,
  read: (source: string) => string,
): ModuleDefinition[] {
  const needle = search.trim().toLowerCase();
  const matching = modules.filter(
    (module) =>
      read(module.label).toLowerCase().includes(needle) ||
      read(module.description).toLowerCase().includes(needle),
  );
  if (sort === 'default') {
    return matching;
  }
  const direction = sort === 'name-asc' ? 1 : -1;
  return matching.toSorted((a, b) => direction * read(a.label).localeCompare(read(b.label)));
}
