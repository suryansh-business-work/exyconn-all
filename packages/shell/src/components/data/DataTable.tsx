import { DataTableView, type DataTableViewProps } from './DataTableView';
import { useDataTableBulk } from './useDataTableBulk';

export type { RowAction } from './DataTableRowActions';
export type { Column } from './DataTableView';

interface DataTableProps<T extends { id: string }> extends Omit<DataTableViewProps<T>, 'bulk'> {
  /**
   * The GraphQL record type the rows are (`Holiday` for `deleteHoliday(id)`). With it, and a
   * row delete, rows get checkboxes and "Delete selected", which runs on the server as a bulk
   * job through that same delete — guards and audit included — and drops the deleted rows from
   * the Apollo cache once it is done.
   */
  bulkEntity?: string;
}

/** A table that ticks rows and deletes them together, as one background job. */
function BulkDataTable<T extends { id: string }>({
  bulkEntity,
  ...props
}: Readonly<DataTableViewProps<T> & { bulkEntity: string }>) {
  const bulk = useDataTableBulk(props.rows, bulkEntity);
  return <DataTableView {...props} bulk={bulk} />;
}

/**
 * Reusable MUI table with optional row edit/delete actions, loading rows, a refresh and — for
 * a table naming its `bulkEntity` — row selection with "Delete selected".
 */
export function DataTable<T extends { id: string }>({
  bulkEntity,
  ...props
}: Readonly<DataTableProps<T>>) {
  if (bulkEntity && props.onDelete) {
    return <BulkDataTable {...props} bulkEntity={bulkEntity} />;
  }
  return <DataTableView {...props} />;
}
