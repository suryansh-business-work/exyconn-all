import type { ReactNode } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@/components/ui';
import { DataTableRowActions, type RowAction } from './DataTableRowActions';
import { TableRefreshButton } from './TableRefreshButton';
import { TableSkeletonRows } from './TableSkeletonRows';

export type { RowAction } from './DataTableRowActions';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRowClick?: (row: T) => void;
  actions?: RowAction<T>[];
  emptyMessage?: string;
  /** True while the rows are being fetched: placeholder rows stand in for the data. */
  loading?: boolean;
  /** Re-runs the query behind the rows; renders a Refresh button above the table. */
  onRefresh?: () => Promise<unknown>;
}

/** Reusable MUI table with optional row edit/delete actions, loading rows and a refresh. */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onEdit,
  onDelete,
  onRowClick,
  actions,
  emptyMessage = 'No records yet.',
  loading = false,
  onRefresh,
}: Readonly<DataTableProps<T>>) {
  const hasActions = Boolean(onEdit || onDelete || actions?.length);

  const toolbar = onRefresh && (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
      <TableRefreshButton
        disabled={loading}
        onRefresh={() => {
          onRefresh().catch((error: unknown) =>
            console.error('Could not refresh the table', error),
          );
        }}
      />
    </Box>
  );

  if (!loading && rows.length === 0) {
    return (
      <>
        {toolbar}
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography
            sx={{
              color: 'text.secondary',
            }}
          >
            {emptyMessage}
          </Typography>
        </Box>
      </>
    );
  }

  const headSx = { fontWeight: 700, color: 'text.secondary', borderColor: 'divider' };
  const cellSx = { borderColor: 'divider' };

  return (
    <>
      {toolbar}
      <TableContainer sx={{ background: 'transparent' }} aria-busy={loading}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} sx={headSx}>
                  {col.label}
                </TableCell>
              ))}
              {hasActions && (
                <TableCell align="right" sx={headSx}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeletonRows
                columnKeys={columns.map((col) => col.key)}
                withActions={hasActions}
              />
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{ '& td': cellSx, cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
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
