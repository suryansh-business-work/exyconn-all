import { Fragment, type ReactNode } from 'react';
import { IconButton, Stack, TableCell, Tooltip } from '@/components/ui';
import { useT } from '@exyconn/i18n';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

/** A custom per-row action rendered alongside edit/delete: an icon button, or a control. */
export type RowAction<T> = IconRowAction<T> | ControlRowAction<T>;

/** An icon button with a tooltip and an accessible name. */
export interface IconRowAction<T> {
  icon: ReactNode;
  tooltip: string;
  ariaLabel: string;
  onClick: (row: T) => void;
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  /** Hides the button on rows it cannot act on — a "convert" that has already converted. */
  hidden?: (row: T) => boolean;
}

/**
 * A control of its own in the actions cell — a switch — which carries its own accessible
 * name (and tooltip, if it wants one). `key` tells it apart from the cell's other actions.
 */
export interface ControlRowAction<T> {
  key: string;
  render: (row: T) => ReactNode;
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
  const t = useT();
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
          .map((action) =>
            'render' in action ? (
              <Fragment key={action.key}>{action.render(row)}</Fragment>
            ) : (
              <Tooltip key={action.ariaLabel} title={t(action.tooltip)}>
                <IconButton
                  size="small"
                  color={action.color ?? 'default'}
                  onClick={() => action.onClick(row)}
                  aria-label={t(action.ariaLabel)}
                >
                  {action.icon}
                </IconButton>
              </Tooltip>
            ),
          )}
        {onEdit && (
          <Tooltip title={t('Edit')}>
            <IconButton size="small" onClick={() => onEdit(row)} aria-label={t('edit')}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title={t('Delete')}>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(row)}
              aria-label={t('delete')}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </TableCell>
  );
}
