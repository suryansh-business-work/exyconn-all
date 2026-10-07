import type { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';
import { formatDate } from './cms-settings.mock';

/** The grid hands every formatter the viewer's translator; English in, English out here. */
const translate = (source: string) => source;

function columnOf<TRow>(columns: readonly ColDef<TRow>[], id: string): ColDef<TRow> {
  const column = columns.find((candidate) => (candidate.colId ?? candidate.field) === id);
  if (!column) throw new Error(`No column ${id}`);
  return column;
}

/** Column ids (or fields), left to right. */
export function columnIds<TRow>(columns: readonly ColDef<TRow>[]): (string | undefined)[] {
  return columns.map((column) => column.colId ?? column.field);
}

/** The text a column's formatter writes for a row (or a raw value), called as ag-grid does. */
export function cellText<TRow>(
  columns: readonly ColDef<TRow>[],
  id: string,
  row: TRow | undefined,
  value?: unknown,
): string {
  const format = columnOf(columns, id).valueFormatter;
  if (typeof format !== 'function') throw new Error(`Column ${id} has no formatter`);
  const params = { data: row, value, context: { t: translate, formatDate } };
  return format(params as ValueFormatterParams<TRow>);
}

/** The status a derived status column reads from a row. */
export function cellStatus<TRow>(
  columns: readonly ColDef<TRow>[],
  id: string,
  row: TRow | undefined,
): unknown {
  const getter = columnOf(columns, id).valueGetter;
  if (typeof getter !== 'function') throw new Error(`Column ${id} has no getter`);
  const params = { data: row, context: { t: translate, formatDate } };
  return getter(params as ValueGetterParams<TRow>);
}

/** The row action specs pinned to the trailing actions column. */
export function actionSpecs<TRow>(columns: readonly ColDef<TRow>[]): RowActionSpec[] {
  const params = columnOf(columns, 'actions').cellRendererParams as {
    actionSpecs: RowActionSpec[];
  };
  return params.actionSpecs;
}

/** Whether the action with `key` is hidden for `row`; an action with no predicate never is. */
export function isActionHidden<TRow>(
  columns: readonly ColDef<TRow>[],
  key: string,
  row: TRow,
): boolean {
  const spec = actionSpecs(columns).find((action) => action.key === key);
  if (!spec) throw new Error(`No ${key} action`);
  const hidden = spec.hidden as ((target: TRow) => boolean) | undefined;
  return hidden ? hidden(row) : false;
}
