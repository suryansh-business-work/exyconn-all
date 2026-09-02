import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import LockResetIcon from '@mui/icons-material/LockReset';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  derivedStatusColumn,
  textColumn,
  type CrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import { Flex } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { userStatus } from '@exyconn/shell/pages/UserDetails/user-details.types';
import type { ListUsersPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedUserRow = ListUsersPagedQuery['listUsersPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type UsersGridContext = CrudGridContext<PagedUserRow>;

const RESET_ACTION: RowActionSpec = {
  key: 'reset',
  label: 'reset password',
  icon: LockResetIcon,
};

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

/** Column model for the server-side Users grid. Only name/email hit the server. */
export const USER_COLUMNS: ColDef<PagedUserRow>[] = [
  textColumn('name', 'Name'),
  textColumn('email', 'Email'),
  {
    headerName: 'Roles',
    colId: 'roles',
    cellRenderer: RolesCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  derivedStatusColumn<PagedUserRow>('status', 'Status', userStatus),
  actionsColumn([EDIT_ACTION, RESET_ACTION, DELETE_ACTION]),
];
