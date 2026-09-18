import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListItCloudResourcesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedCloudResourceRow =
  ListItCloudResourcesPagedQuery['listItCloudResourcesPaged']['rows'][number];

export type CloudGridContext = DatedCrudGridContext<PagedCloudResourceRow>;

/** Column model for the cloud & infrastructure register. */
export const CLOUD_COLUMNS: ColDef<PagedCloudResourceRow>[] = [
  textColumn('name', 'Name'),
  statusColumn('kind', 'Kind'),
  textColumn('provider', 'Provider'),
  statusColumn('environment', 'Environment'),
  dateColumn('expiresAt', 'Expires', '—'),
  valueColumn('monthlyCost', 'Monthly cost', (row) => row.monthlyCost.toLocaleString()),
  statusColumn('status', 'Status'),
  actionsColumn(),
];
