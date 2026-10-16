import type { ColDef } from 'ag-grid-community';
import type { TableExportColumnInput } from '@exyconn/shell/graphql/generated';
import { isDisplayColumn } from '../grid/cellValue';

/**
 * The grid's columns a server export can write: the ones backed by a row field (dotted for a
 * nested one), headed as the grid heads them. A column computed in the browser has no field
 * for the server to read, so it is left out.
 */
export function exportColumnsOf<Row>(
  columnDefs: readonly ColDef<Row>[],
  t: (source: string) => string,
): TableExportColumnInput[] {
  return columnDefs
    .filter(isDisplayColumn)
    .flatMap((column) =>
      column.field ? [{ field: column.field, header: t(column.headerName) }] : [],
    );
}
