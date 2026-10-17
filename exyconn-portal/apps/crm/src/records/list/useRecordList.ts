import { useMemo } from 'react';
import type { ColDef } from 'ag-grid-community';
import type { TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid';
import type { CrmObject } from '@exyconn/shell/graphql/generated';
import { useRecordColumns } from '../columns/useRecordColumns';
import { useObjectSchema, type CrmRecordRow } from '../schema';
import { toSnapshot, type RecordQuerySnapshot } from './recordQuery';
import { useRecordFetcher, type RecordSearchDocument } from './useRecordFetcher';
import { useRecordQuery } from './useRecordQuery';

export interface UseRecordListOptions<TQuery, TRow> {
  object: CrmObject;
  /** The generated search document — `SearchLeadsDocument` and so on. */
  document: RecordSearchDocument<TQuery>;
  /** Picks the page off the result; annotate its parameter with the generated query type. */
  select: (data: TQuery) => TablePageResult<TRow>;
  /**
   * The page's hand-written columns (chips, badges, formatting) and its trailing actions
   * column. They are the default layout; any other property gets a plain column.
   */
  columns: readonly ColDef<TRow>[];
}

/**
 * Everything a HubSpot-style CRM list needs around its CrudDashboard: the record type's
 * properties, the saved views and the working query (filters, sorts, columns, search), the
 * column model for it and the `fetchRows` that sends it. Render `RecordListToolbar` with the
 * result, and hand the dashboard `columnDefs`, `fetchRows`, `initialSearch`, `key={gridKey}`
 * and `withRefreshSignal(crud, refreshSignal)`.
 */
export function useRecordList<TQuery, TRow extends CrmRecordRow>({
  object,
  document,
  select,
  columns,
}: UseRecordListOptions<TQuery, TRow>) {
  const schema = useObjectSchema(object);
  const list = useRecordQuery(object);
  const fetchRows = useRecordFetcher(document, select, list.queryRef, list.record);
  const view = useRecordColumns(columns, schema.fields, list.query.columns, list.query.sorts);
  const snapshot = useMemo<RecordQuerySnapshot>(
    () => ({ ...toSnapshot(list.query), columns: view.exportColumns }),
    [list.query, view.exportColumns],
  );
  return {
    object,
    schema,
    list,
    view,
    snapshot,
    fetchRows,
    columnDefs: view.columnDefs,
    initialSearch: list.query.search,
    gridKey: list.gridKey,
    refreshSignal: list.refreshSignal,
  };
}

export type RecordList = ReturnType<typeof useRecordList>;

/**
 * A CrudDashboard reads its grid's reload signal off `crud` when it has one, so the list's
 * own signal is added to it: a change to the query reloads the rows as a save does.
 */
export function withRefreshSignal<T extends { refreshSignal: number }>(crud: T, signal: number): T {
  return { ...crud, refreshSignal: crud.refreshSignal + signal };
}
