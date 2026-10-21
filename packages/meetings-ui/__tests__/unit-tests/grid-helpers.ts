import type { ColDef } from 'ag-grid-community';

/** Fills `{placeholders}` the way the viewer's translator does for English. */
export function englishT(source: string, values: Record<string, unknown> = {}): string {
  return source.replaceAll(/\{(\w+)\}/g, (_match, key: string) => String(values[key]));
}

const CONTEXT = {
  t: englishT,
  formatDate: (value: string) => `day ${value}`,
  formatDateTime: (value: string) => `at ${value}`,
};

/** The column with this field or column id. */
export function columnOf<T>(columns: readonly ColDef<T>[], key: string): ColDef<T> {
  const found = columns.find((column) => column.field === key || column.colId === key);
  if (!found) {
    throw new Error(`No column ${key}`);
  }
  return found;
}

/** What a column's formatter (or getter) writes for a row, as the grid would call it. */
export function cellText<T>(column: ColDef<T>, row: T | undefined): unknown {
  const field = column.field as keyof T | undefined;
  const value = row && field ? row[field] : undefined;
  const params = { data: row, value, context: CONTEXT } as never;
  if (typeof column.valueFormatter === 'function') {
    return column.valueFormatter(params);
  }
  if (typeof column.valueGetter === 'function') {
    return column.valueGetter(params);
  }
  return value;
}
