import type { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import { interpolate, type Interpolations } from '@exyconn/i18n';
import type { RowActionSpec } from '@exyconn/crud';

/** The grid hands every formatter the viewer's translator; English in, English out here. */
const translate = (source: string, values?: Interpolations) => interpolate(source, values);

/** Field (or colId) of every column, left to right. */
export function columnIds<TRow>(columns: ColDef<TRow>[]): (string | undefined)[] {
  return columns.map((column) => column.field ?? column.colId);
}

function columnFor<TRow>(columns: ColDef<TRow>[], id: string): ColDef<TRow> {
  const column = columns.find((candidate) => (candidate.field ?? candidate.colId) === id);
  if (!column) throw new Error(`No column ${id}`);
  return column;
}

/** The text a column's formatter writes for a row, called the way ag-grid calls it. */
export function formatCell<TRow>(
  columns: ColDef<TRow>[],
  id: string,
  row: TRow | undefined,
  extra: Readonly<{ value?: unknown; context?: object }> = {},
): string {
  const format = columnFor(columns, id).valueFormatter;
  if (typeof format !== 'function') throw new Error(`Column ${id} has no formatter`);
  const params = {
    data: row,
    value: extra.value,
    context: { t: translate, ...extra.context },
  } as ValueFormatterParams<TRow>;
  return format(params);
}

/** The value a column's getter derives for a row (a status chip's label, say). */
export function cellValue<TRow>(columns: ColDef<TRow>[], id: string, row: TRow): unknown {
  const getter = columnFor(columns, id).valueGetter;
  if (typeof getter !== 'function') throw new Error(`Column ${id} has no getter`);
  return getter({ data: row, context: { t: translate } } as ValueGetterParams<TRow>);
}

/** The row action specs pinned to the trailing actions column. */
export function actionSpecs<TRow>(columns: ColDef<TRow>[]): RowActionSpec[] {
  const params = columnFor(columns, 'actions').cellRendererParams as {
    actionSpecs: RowActionSpec[];
  };
  return params.actionSpecs;
}

/** Whether the action with `key` is hidden for `row`; an action with no predicate never is. */
export function isActionHidden<TRow>(columns: ColDef<TRow>[], key: string, row: TRow): boolean {
  const spec = actionSpecs(columns).find((action) => action.key === key);
  if (!spec) throw new Error(`No ${key} action`);
  const hidden = spec.hidden as ((target: TRow) => boolean) | undefined;
  return hidden ? hidden(row) : false;
}
