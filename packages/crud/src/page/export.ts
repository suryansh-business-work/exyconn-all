import type { ColDef } from 'ag-grid-community';
import type { GridQuery, TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid';
import type { TableQueryInput } from '@exyconn/shell/graphql/generated';
import type { CsvColumn } from '@exyconn/shell/utils/csv';
import { cellValue, isDisplayColumn } from '../grid/cellValue';

/**
 * Rows per request when exporting. The server caps a page at 200 (tableQuery's
 * MAX_PAGE_SIZE), so asking for more would silently return fewer and the loop below
 * would still terminate on the total — but it is clearer to ask for what we get.
 */
export const EXPORT_PAGE_SIZE = 200;

/**
 * The grid's visible columns as CSV columns. `context` is what the page hands ag-grid —
 * with `formatDate` on it, so a date column exports exactly what it displays.
 */
export function csvColumnsFromDefs<Row>(
  columnDefs: readonly ColDef<Row>[],
  context: object,
): CsvColumn<Row>[] {
  return columnDefs.filter(isDisplayColumn).map((column) => ({
    header: column.headerName,
    value: (row: Row) => cellValue(column, row, context),
  }));
}

/**
 * Every row behind a grid query, page after page, in the order the server sorts them.
 * Stops on the server's own total, so a table that grows mid-export does not loop forever.
 */
export async function fetchAllRows<Row>(
  fetchRows: (input: TableQueryInput) => Promise<TablePageResult<Row>>,
  query: GridQuery,
  pageSize = EXPORT_PAGE_SIZE,
): Promise<Row[]> {
  const rows: Row[] = [];
  let page = 0;
  let totalCount = Number.POSITIVE_INFINITY;
  while (rows.length < totalCount) {
    const result = await fetchRows({ ...query, page, pageSize });
    if (result.rows.length === 0) {
      break;
    }
    rows.push(...result.rows);
    totalCount = result.totalCount;
    page += 1;
  }
  return rows;
}
