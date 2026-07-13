import type { ReactNode } from 'react';
import {
  Box,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@/components/ui';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

/** A custom per-row action button rendered alongside edit/delete. */
export interface RowAction<T> {
  icon: ReactNode;
  tooltip: string;
  ariaLabel: string;
  onClick: (row: T) => void;
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRowClick?: (row: T) => void;
  actions?: RowAction<T>[];
  emptyMessage?: string;
}

/** Reusable MUI table with optional row edit/delete actions. */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onEdit,
  onDelete,
  onRowClick,
  actions,
  emptyMessage = 'No records yet.',
}: DataTableProps<T>) {
  const hasActions = Boolean(onEdit || onDelete || actions?.length);

  if (rows.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  const headSx = { fontWeight: 700, color: 'text.secondary', borderColor: 'divider' };
  const cellSx = { borderColor: 'divider' };

  return (
    <TableContainer sx={{ background: 'transparent' }}>
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
          {rows.map((row) => (
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
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    {actions?.map((action) => (
                      <Tooltip key={action.ariaLabel} title={action.tooltip}>
                        <IconButton
                          size="small"
                          color={action.color ?? 'default'}
                          onClick={() => action.onClick(row)}
                          aria-label={action.ariaLabel}
                        >
                          {action.icon}
                        </IconButton>
                      </Tooltip>
                    ))}
                    {onEdit && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(row)} aria-label="edit">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDelete(row)}
                          aria-label="delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
