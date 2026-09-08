import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListStatusMaintenanceWindowsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedMaintenanceRow =
  ListStatusMaintenanceWindowsPagedQuery['listStatusMaintenanceWindowsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type MaintenanceGridContext = DatedCrudGridContext<PagedMaintenanceRow>;

/** Column model for planned maintenance windows. */
export const MAINTENANCE_COLUMNS: ColDef<PagedMaintenanceRow>[] = [
  textColumn('title', 'Window'),
  valueColumn('affectedServiceKeys', 'Services', (row) => row.affectedServiceKeys.join(', ')),
  dateColumn('startsAt', 'Starts'),
  dateColumn('endsAt', 'Ends'),
  textColumn('createdBy', 'Planned by'),
  actionsColumn(),
];
