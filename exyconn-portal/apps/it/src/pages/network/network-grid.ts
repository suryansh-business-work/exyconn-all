import type { ColDef } from 'ag-grid-community';
import { actionsColumn, statusColumn, textColumn, type CrudGridContext } from '@exyconn/crud';
import type { ListItNetworkItemsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedNetworkItemRow =
  ListItNetworkItemsPagedQuery['listItNetworkItemsPaged']['rows'][number];

export type NetworkGridContext = CrudGridContext<PagedNetworkItemRow>;

/** Column model for the network register. */
export const NETWORK_COLUMNS: ColDef<PagedNetworkItemRow>[] = [
  textColumn('name', 'Name'),
  statusColumn('kind', 'Kind'),
  textColumn('address', 'Address'),
  textColumn('location', 'Location'),
  textColumn('provider', 'Provider'),
  statusColumn('status', 'Status'),
  actionsColumn(),
];
