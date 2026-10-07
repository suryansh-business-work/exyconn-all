import type { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';

/** What every grid puts on ag-grid's context: an English translator and the viewer's dates. */
const context = { t: (source: string) => source, formatDate: (value: string) => `on ${value}` };

/** The column keyed by its field or colId. */
export function columnOf<T>(columns: readonly ColDef<T>[], key: string): ColDef<T> {
  const found = columns.find((column) => column.field === key || column.colId === key);
  if (!found) {
    throw new Error(`No column ${key}`);
  }
  return found;
}

/** What a column's formatter shows for a row (undefined while it loads) and a raw value. */
export function formatCell<T>(
  columns: readonly ColDef<T>[],
  key: string,
  data: T | undefined,
  value?: unknown,
): string {
  const formatter = columnOf(columns, key).valueFormatter as (
    params: ValueFormatterParams<T>,
  ) => string;
  return formatter({ data, value, context } as ValueFormatterParams<T>);
}

/** What a derived column's getter reads off a row (undefined while it loads). */
export function getCell<T>(columns: readonly ColDef<T>[], key: string, data: T | undefined) {
  const getter = columnOf(columns, key).valueGetter as (params: ValueGetterParams<T>) => unknown;
  return getter({ data, context } as ValueGetterParams<T>);
}

/** The column headers in order. */
export const headersOf = <T>(columns: readonly ColDef<T>[]) =>
  columns.map((column) => column.headerName);
