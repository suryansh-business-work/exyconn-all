import type { SortModelItem } from 'ag-grid-community';
import {
  FilterOp,
  SortDir,
  type TableFilterInput,
  type TableQueryInput,
  type TableSortInput,
} from '@/graphql/generated';

export const SEARCH_DEBOUNCE_MS = 300;

/** What the grid is currently asking the server for, minus the page — search, sort, filters. */
export type GridQuery = Omit<TableQueryInput, 'page' | 'pageSize'>;

export const TEXT_FILTER_PARAMS = {
  filterOptions: ['contains', 'equals', 'startsWith'],
  maxNumConditions: 1,
  debounceMs: SEARCH_DEBOUNCE_MS,
};

/** Maps an ag-grid text-filter type to the server's FilterOp (defaulting to CONTAINS). */
function toFilterOp(type: string | undefined): FilterOp {
  if (type === 'equals') {
    return FilterOp.Equals;
  }
  if (type === 'startsWith') {
    return FilterOp.StartsWith;
  }
  return FilterOp.Contains;
}

/** Flattens ag-grid's per-column filter model into the server's filter list. */
export function toFilters(
  model: Record<string, { type?: string; filter?: unknown }>,
): TableFilterInput[] {
  const filters: TableFilterInput[] = [];
  for (const [field, def] of Object.entries(model)) {
    const value = def.filter == null ? '' : String(def.filter);
    if (value !== '') {
      filters.push({ field, op: toFilterOp(def.type), value });
    }
  }
  return filters;
}

/** ag-grid allows multi-sort; the server sorts by a single column, so take the first. */
export function toSort(sortModel: SortModelItem[]): TableSortInput | null {
  const first = sortModel[0];
  if (!first) {
    return null;
  }
  return { field: first.colId, dir: first.sort === 'desc' ? SortDir.Desc : SortDir.Asc };
}
