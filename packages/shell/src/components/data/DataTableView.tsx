import type { KeyboardEvent, ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  fontWeight,
} from '@/components/ui';
import { DataTableRowActions, type RowAction } from './DataTableRowActions';
import { SelectAllCell, SelectRowCell } from './DataTableSelection';
import { DataTableToolbar } from './DataTableToolbar';
import { TableSkeletonRows } from './TableSkeletonRows';
import { EmptyState } from '../feedback/EmptyState';
import { cellText } from '../../utils/cellText';
import type { DataTableBulk } from './useDataTableBulk';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

export interface DataTableViewProps<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRowClick?: (row: T) => void;
  actions?: RowAction<T>[];
  emptyMessage?: string;
  /** True while the rows are being fetched: placeholder rows stand in until the first arrive. */
  loading?: boolean;
  /** Re-runs the query behind the rows; renders a Refresh button above the table. */
  onRefresh?: () => Promise<unknown>;
  /** Row selection and "Delete selected", when the table offers them. */
  bulk?: DataTableBulk;
  /** More buttons for the ticked rows, drawn beside "Delete selected" while any are ticked. */
  selectionActions?: (selectedIds: readonly string[]) => ReactNode;
}

const HEAD_SX = { fontWeight: fontWeight.bold, color: 'text.secondary', borderColor: 'divider' };
const CELL_SX = { borderColor: 'divider' };

/** The MUI table itself: headings, rows (or placeholders), row actions and checkboxes. */
export function DataTableView<T extends { id: string }>({
  columns,
  rows,
  onEdit,
  onDelete,
  onRowClick,
  actions,
  emptyMessage = 'No records yet.',
  loading = false,
  onRefresh,
  bulk,
  selectionActions,
}: Readonly<DataTableViewProps<T>>) {
  const t = useT();
  const hasActions = Boolean(onEdit || onDelete || actions?.length);
  const toolbar = (
    <DataTableToolbar
      loading={loading}
      onRefresh={onRefresh}
      bulk={bulk}
      selectionActions={selectionActions}
    />
  );

  if (!loading && rows.length === 0) {
    return (
      <>
        {toolbar}
        <EmptyState title={emptyMessage} />
      </>
    );
  }

  // A row that opens on click opens on Enter and Space too, and is in the tab order, or it
  // is a link only a mouse can follow (SC 2.1.1).
  const rowKeyHandler = (row: T) => (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick?.(row);
    }
  };

  // Rows already on screen stay while a refetch runs (after a delete, say): placeholders only
  // stand in before the first rows arrive, so nothing flashes.
  const placeholders = loading && rows.length === 0;
  const columnKeys = columns.map((col) => col.key);

  return (
    <>
      {toolbar}
      {/* Focusable because it scrolls: a table wider or taller than its box is a scrollable
          region, and a region somebody can only reach with a mouse fails WCAG 2.2 AA
          (scrollable-region-focusable). One tab stop per table is the price of being able to
          read the rest of a wide table from the keyboard. */}
      <TableContainer tabIndex={0} sx={{ background: 'transparent' }} aria-busy={loading}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {bulk && <SelectAllCell bulk={bulk} rowCount={rows.length} />}
              {columns.map((col) => (
                <TableCell key={col.key} sx={HEAD_SX}>
                  {t(col.label)}
                </TableCell>
              ))}
              {hasActions && (
                <TableCell align="right" sx={HEAD_SX}>
                  {t('Actions')}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {placeholders ? (
              <TableSkeletonRows
                columnKeys={bulk ? ['__select', ...columnKeys] : columnKeys}
                withActions={hasActions}
              />
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  selected={bulk?.isSelected(row.id)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? rowKeyHandler(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  sx={{ '& td': CELL_SX, cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {bulk && <SelectRowCell bulk={bulk} id={row.id} />}
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render(row)
                        : cellText((row as Record<string, unknown>)[col.key])}
                    </TableCell>
                  ))}
                  {hasActions && (
                    <DataTableRowActions
                      row={row}
                      actions={actions}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
