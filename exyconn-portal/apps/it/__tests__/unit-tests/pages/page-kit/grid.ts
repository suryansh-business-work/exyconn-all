import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';

/** The grid hands every formatter the viewer's translator; English in, English out here. */
const translate = (source: string) => source;

/** Field (or colId) of every column, left to right. */
export function columnIds<TRow>(columns: readonly ColDef<TRow>[]): (string | undefined)[] {
  return columns.map((column) => column.field ?? column.colId);
}

/** The text a column's formatter writes for a row (undefined while it loads), as ag-grid calls it. */
export function formatCell<TRow>(
  columns: readonly ColDef<TRow>[],
  id: string,
  row: TRow | undefined,
): string {
  const column = columns.find((candidate) => (candidate.field ?? candidate.colId) === id);
  const format = column?.valueFormatter;
  if (typeof format !== 'function') {
    throw new TypeError(`Column ${id} has no formatter`);
  }
  return format({ data: row, context: { t: translate } } as ValueFormatterParams<TRow>);
}

/** The row action specs pinned to the trailing actions column. */
export function actionSpecs<TRow>(columns: readonly ColDef<TRow>[]): RowActionSpec[] {
  const params = columns.find((column) => column.colId === 'actions')?.cellRendererParams as
    { actionSpecs: RowActionSpec[] } | undefined;
  if (!params) {
    throw new Error('The grid has no actions column');
  }
  return params.actionSpecs;
}

/** Whether the action with `key` is hidden for `row`; an action with no predicate never is. */
export function isActionHidden<TRow>(
  columns: readonly ColDef<TRow>[],
  key: string,
  row: TRow,
): boolean {
  const spec = actionSpecs(columns).find((action) => action.key === key);
  if (!spec) {
    throw new Error(`No ${key} action`);
  }
  const hidden = spec.hidden as ((target: TRow) => boolean) | undefined;
  return hidden ? hidden(row) : false;
}
