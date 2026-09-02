import type { ColDef } from 'ag-grid-community';
import { actionsColumn, statusColumn, textColumn, type CrudGridContext } from '@exyconn/crud';
import type { ListClientsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedClientRow = ListClientsPagedQuery['listClientsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type ClientsGridContext = CrudGridContext<PagedClientRow>;

/** Column model for the server-side Clients grid. Name/company/email/phone hit the server filter. */
export const CLIENT_COLUMNS: ColDef<PagedClientRow>[] = [
  textColumn('name', 'Name'),
  textColumn('company', 'Company'),
  textColumn('email', 'Email'),
  textColumn('phone', 'Phone'),
  statusColumn('status', 'Status'),
  actionsColumn(),
];
