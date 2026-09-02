import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import type { ListLeadsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedLeadRow = ListLeadsPagedQuery['listLeadsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type LeadsGridContext = CrudGridContext<PagedLeadRow>;

/** Column model for the server-side Leads grid. Name/Email hit the server filter. */
export const LEAD_COLUMNS: ColDef<PagedLeadRow>[] = [
  textColumn('name', 'Name'),
  textColumn('email', 'Email'),
  statusColumn('source', 'Source'),
  valueColumn('value', 'Value', (row) => row.value.toLocaleString()),
  statusColumn('stage', 'Stage'),
  actionsColumn(),
];
