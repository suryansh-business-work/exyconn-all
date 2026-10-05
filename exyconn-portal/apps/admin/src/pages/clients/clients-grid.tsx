import type { ColDef } from 'ag-grid-community';
import KeyIcon from '@mui/icons-material/Key';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  statusColumn,
  textColumn,
  type CrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListClientsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedClientRow = ListClientsPagedQuery['listClientsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type ClientsGridContext = CrudGridContext<PagedClientRow>;

/** Who at the client may sign in to the client hub (clienthub.exyconn.com). */
export const HUB_ACCESS_ACTION: RowActionSpec = {
  key: 'hubAccess',
  label: 'client hub access',
  icon: KeyIcon,
  color: 'primary',
};

/** Column model for the server-side Clients grid. Name/company/email/phone hit the server filter. */
export const CLIENT_COLUMNS: ColDef<PagedClientRow>[] = [
  textColumn('name', 'Name'),
  textColumn('company', 'Company'),
  textColumn('email', 'Email'),
  textColumn('phone', 'Phone'),
  statusColumn('status', 'Status'),
  actionsColumn([HUB_ACCESS_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
