import type { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';

/** A column that can produce a value for a row without rendering a React cell. */
export type DisplayColDef<Row> = ColDef<Row> & { headerName: string };

/**
 * Whether a column can be read outside the grid — for a CSV file, or for the card a phone
 * shows instead of a table. It needs a heading and some way to a value, and the actions
 * column is neither.
 */
export function isDisplayColumn<Row>(column: ColDef<Row>): column is DisplayColDef<Row> {
  const hasValue = Boolean(column.field || column.valueGetter || column.valueFormatter);
  return Boolean(column.headerName) && hasValue && column.colId !== 'actions';
}

/** `a.b.c` on a row, the way ag-grid resolves a dotted `field`. */
function fieldValue(row: unknown, field: string): unknown {
  return field
    .split('.')
    .reduce<unknown>((value, key) => (value as Record<string, unknown> | null)?.[key], row);
}

/**
 * One column's cell value for a row, the same way the grid shows it: the formatter when
 * there is one (dates through the viewer's settings, money through its format), else the
 * getter, else the raw field.
 *
 * Shared so the three places a row can appear — the grid, the export and the phone's card
 * list — can never disagree about what a cell says.
 */
export function cellValue<Row>(column: DisplayColDef<Row>, row: Row, context: object): unknown {
  const raw =
    typeof column.valueGetter === 'function'
      ? column.valueGetter({ data: row, context } as ValueGetterParams<Row>)
      : fieldValue(row, column.field ?? '');
  if (typeof column.valueFormatter === 'function') {
    return column.valueFormatter({ data: row, value: raw, context } as ValueFormatterParams<Row>);
  }
  return raw;
}
