import type { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';

/** The grid hands every formatter the viewer's translator; English in, English out here. */
const translate = (source: string) => source;

/** Field (or colId) of every column, left to right. */
export function columnIds<TRow>(columns: ColDef<TRow>[]): (string | undefined)[] {
  return columns.map((column) => column.field ?? column.colId);
}

/** The text a column's formatter writes for a row, called the way ag-grid calls it. */
export function formatCell<TRow>(
  columns: ColDef<TRow>[],
  field: string,
  row: TRow | undefined,
  extra: Readonly<{ value?: unknown; context?: object }> = {},
): string {
  const format = columns.find((column) => column.field === field)?.valueFormatter;
  if (typeof format !== 'function') throw new Error(`Column ${field} has no formatter`);
  const params = {
    data: row,
    value: extra.value,
    context: { t: translate, ...extra.context },
  } as ValueFormatterParams<TRow>;
  return format(params);
}

/** The row action specs pinned to the trailing actions column. */
export function actionSpecs<TRow>(columns: ColDef<TRow>[]): RowActionSpec[] {
  const params = columns.find((column) => column.colId === 'actions')?.cellRendererParams as
    { actionSpecs: RowActionSpec[] } | undefined;
  if (!params) throw new Error('The grid has no actions column');
  return params.actionSpecs;
}

/** What a derived column's value getter reads off a row, called the way ag-grid calls it. */
export function cellValue<TRow>(
  columns: ColDef<TRow>[],
  colId: string,
  row: TRow | undefined,
): unknown {
  const getter = columns.find((column) => (column.colId ?? column.field) === colId)?.valueGetter;
  if (typeof getter !== 'function') throw new Error(`Column ${colId} has no value getter`);
  return getter({ data: row, context: { t: translate } } as ValueGetterParams<TRow>);
}
