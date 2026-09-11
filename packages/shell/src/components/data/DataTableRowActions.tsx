import type { ReactNode } from 'react';
import { IconButton, Stack, TableCell, Tooltip } from '@/components/ui';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

/** A custom per-row action button rendered alongside edit/delete. */
export interface RowAction<T> {
  icon: ReactNode;
  tooltip: string;
  ariaLabel: string;
  onClick: (row: T) => void;
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  /** Hides the button on rows it cannot act on — a "convert" that has already converted. */
  hidden?: (row: T) => boolean;
}

interface DataTableRowActionsProps<T> {
  row: T;
  actions?: RowAction<T>[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

/** The trailing "Actions" cell of a {@link DataTable} row: custom actions, then edit/delete. */
export function DataTableRowActions<T>({
  row,
  actions,
  onEdit,
  onDelete,
}: Readonly<DataTableRowActionsProps<T>>) {
  return (
    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          justifyContent: 'flex-end',
        }}
      >
        {actions
          ?.filter((action) => !action.hidden?.(row))
          .map((action) => (
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
  );
}
