import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import { Flex, IconButton } from '@/components/ui';
import { StatusChip } from '../../../components/data/StatusChip';
import { userStatus } from './UserDetails/user-details.types';
import type { ListUsersPagedQuery } from '../../../graphql/generated';

export type PagedUserRow = ListUsersPagedQuery['listUsersPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the action cell via its `context`. */
export interface UsersGridContext {
  onEdit: (row: PagedUserRow) => void;
  onReset: (row: PagedUserRow) => void;
  onDelete: (row: PagedUserRow) => void;
}

function RolesCell(params: Readonly<ICellRendererParams<PagedUserRow>>) {
  const roles = params.data?.roles ?? [];
  return (
    <Flex direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {roles.map((role) => (
        <StatusChip key={role} value={role} />
      ))}
    </Flex>
  );
}

function StatusCell(params: Readonly<ICellRendererParams<PagedUserRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={userStatus(params.data)} />;
}

function UserActionsCell(params: Readonly<ICellRendererParams<PagedUserRow>>) {
  const row = params.data;
  const ctx = params.context as UsersGridContext;
  if (!row) {
    return null;
  }
  // Stop the click from also triggering the row's navigate handler.
  const run = (handler: (target: PagedUserRow) => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler(row);
  };
  return (
    <Flex direction="row" spacing={0.25}>
      <IconButton size="small" aria-label="edit" onClick={run(ctx.onEdit)}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="reset password" onClick={run(ctx.onReset)}>
        <LockResetIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="delete" onClick={run(ctx.onDelete)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Flex>
  );
}

/** Column model for the server-side Users grid. Only name/email hit the server. */
export const USER_COLUMNS: ColDef<PagedUserRow>[] = [
  { field: 'name', headerName: 'Name' },
  { field: 'email', headerName: 'Email' },
  {
    headerName: 'Roles',
    colId: 'roles',
    cellRenderer: RolesCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    headerName: 'Status',
    colId: 'status',
    cellRenderer: StatusCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    headerName: '',
    colId: 'actions',
    cellRenderer: UserActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 150,
    minWidth: 150,
  },
];
