import type { GraphQLContext } from '../../middleware/auth';
import type { TableConfig } from '../../utils/tableQuery';

/**
 * Every paged list by query name (`listClientsPaged`), with what its table config lets a client
 * filter and sort on, and — for a list open to imports — the fields that identify an existing
 * record. The grid reads it (`tableInfo`) to offer only the filters and sorts the server honours;
 * a filter on any other field would be dropped by `tableQuery` without a word.
 *
 * `createCrudResolvers` registers its lists; a hand-written paged resolver registers its own
 * beside it, and a test fails for any `…Paged` query left out.
 */
export interface RegisteredTable {
  filterFields: readonly string[];
  sortFields: readonly string[];
  /** Null when the list takes no import; empty when it takes CREATE only. */
  matchFields: readonly string[] | null;
}

const tables = new Map<string, RegisteredTable>();

/**
 * Registers a paged list. A match field is looked up with an EQUALS column filter, so it must
 * be one the list can filter on — otherwise the lookup would ignore it and an update could
 * land on the wrong record. A wrong config fails at boot, not in an import.
 */
export function registerTable(
  list: string,
  table: Pick<TableConfig, 'filterFields' | 'sortFields'>,
  importMatchFields: readonly string[] | null = null,
): void {
  const filterable = new Set(table.filterFields);
  const unfilterable = (importMatchFields ?? []).filter((field) => !filterable.has(field));
  if (unfilterable.length > 0) {
    throw new Error(
      `${list} matches imports on ${unfilterable.join(', ')}, which it cannot filter`,
    );
  }
  tables.set(list, {
    filterFields: table.filterFields,
    sortFields: table.sortFields,
    matchFields: importMatchFields,
  });
}

/** The registered list, or null for a name no list registered. */
export function registeredTable(list: string): RegisteredTable | null {
  return tables.get(list) ?? null;
}

/**
 * Archives or restores records of a list as the caller: checks the module's EDIT permission,
 * writes, audits, and returns how many changed.
 */
export type TableArchiver = (
  ctx: GraphQLContext,
  ids: string[],
  archived: boolean,
) => Promise<number>;

/** What a grid's "Delete selected" and "Archive selected" act on for one list. */
export interface BulkTarget {
  /** The record type: deleting runs its own `delete<Entity>(id)` mutation. */
  entity: string;
  archive: TableArchiver | null;
}

const bulkTargets = new Map<string, BulkTarget>();

/**
 * Opens a list to bulk actions. `createCrudResolvers` registers its paged lists; a hand-written
 * list (the CRM's) registers its own. Delete needs nothing more than the module's own delete
 * mutation, so a paged list left out still deletes in bulk — only archiving needs this.
 */
export function registerBulkTarget(list: string, target: BulkTarget): void {
  bulkTargets.set(list, target);
}

export function registeredBulkTarget(list: string): BulkTarget | null {
  return bulkTargets.get(list) ?? null;
}
