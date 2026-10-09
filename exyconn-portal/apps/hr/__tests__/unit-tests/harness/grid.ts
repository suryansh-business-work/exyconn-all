import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
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
  id: string,
  row: TRow | undefined,
  context: object = {},
): string {
  const column = columns.find((candidate) => (candidate.field ?? candidate.colId) === id);
  const format = column?.valueFormatter;
  if (typeof format !== 'function') {
    throw new TypeError(`Column ${id} has no formatter`);
  }
  const params = { data: row, context: { t: translate, ...context } };
  return format(params as ValueFormatterParams<TRow>);
}

/** The keys of the row actions pinned to the trailing actions column. */
export function actionKeys<TRow>(columns: ColDef<TRow>[]): string[] {
  const params = columns.find((column) => column.colId === 'actions')?.cellRendererParams as
    { actionSpecs: RowActionSpec[] } | undefined;
  return (params?.actionSpecs ?? []).map((action) => action.key);
}
