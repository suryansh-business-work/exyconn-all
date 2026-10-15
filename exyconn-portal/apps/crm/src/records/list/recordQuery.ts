import type {
  CrmFilterGroupInput,
  CrmOp,
  CrmSortInput,
  CrmViewsQuery,
} from '@exyconn/shell/graphql/generated';

/** A saved view as the server returns it. */
export type CrmViewRow = CrmViewsQuery['crmViews'][number];

/** One filter condition. `id` only exists on the client, so React has a stable key for it. */
export interface FilterCondition {
  id: string;
  property: string;
  op: CrmOp;
  values: string[];
}

/** Conditions that must all hold; a record matches when any group does. */
export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
}

/** Everything a list asks the server for, apart from the page: what a saved view stores. */
export interface RecordQueryState {
  search: string;
  groups: FilterGroup[];
  sorts: CrmSortInput[];
  /** Visible column ids in order; empty means the page's own default columns. */
  columns: string[];
}

/** The query as the server and the import/export buttons take it — no client ids. */
export interface RecordQuerySnapshot {
  search: string;
  groups: CrmFilterGroupInput[];
  sorts: CrmSortInput[];
  columns: string[];
}

/** The "All records" view: no search, no filters, newest first, default columns. */
export const EMPTY_QUERY: RecordQueryState = { search: '', groups: [], sorts: [], columns: [] };

export const newId = (): string => globalThis.crypto.randomUUID();

/** The server's groups without the client ids (and without any `__typename`). */
export function toGroupInputs(groups: readonly FilterGroup[]): CrmFilterGroupInput[] {
  return groups
    .filter((group) => group.conditions.length > 0)
    .map((group) => ({
      conditions: group.conditions.map(({ property, op, values }) => ({ property, op, values })),
    }));
}

/** Sorts without any `__typename` the cache put on them. */
export function toSortInputs(sorts: readonly CrmSortInput[]): CrmSortInput[] {
  return sorts.map(({ property, dir }) => ({ property, dir }));
}

/** A saved view, as the list's working query. */
export function queryOfView(view: CrmViewRow): RecordQueryState {
  return {
    search: view.search,
    groups: view.groups.map((group) => ({
      id: newId(),
      conditions: group.conditions.map(({ property, op, values }) => ({
        id: newId(),
        property,
        op,
        values: [...values],
      })),
    })),
    sorts: toSortInputs(view.sorts),
    columns: [...view.columns],
  };
}

export function toSnapshot(query: RecordQueryState): RecordQuerySnapshot {
  return {
    search: query.search.trim(),
    groups: toGroupInputs(query.groups),
    sorts: toSortInputs(query.sorts),
    columns: [...query.columns],
  };
}

/** Whether two queries ask for the same thing — the "unsaved changes" test. */
export function sameQuery(a: RecordQueryState, b: RecordQueryState): boolean {
  return JSON.stringify(toSnapshot(a)) === JSON.stringify(toSnapshot(b));
}

/** How many conditions are active — the Filters button's badge. */
export function conditionCount(groups: readonly FilterGroup[]): number {
  return groups.reduce((total, group) => total + group.conditions.length, 0);
}

/** The groups with one condition taken out, dropping a group it leaves empty. */
export function withoutCondition(groups: readonly FilterGroup[], conditionId: string) {
  return groups
    .map((group) => ({
      ...group,
      conditions: group.conditions.filter((condition) => condition.id !== conditionId),
    }))
    .filter((group) => group.conditions.length > 0);
}
