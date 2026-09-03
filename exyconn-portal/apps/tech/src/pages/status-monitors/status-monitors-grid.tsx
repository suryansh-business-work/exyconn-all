import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import type { ListStatusMonitorsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedStatusMonitorRow =
  ListStatusMonitorsPagedQuery['listStatusMonitorsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type StatusMonitorsGridContext = CrudGridContext<PagedStatusMonitorRow>;

/** Column model for the monitor catalogue behind status.exyconn.com. */
export const STATUS_MONITOR_COLUMNS: ColDef<PagedStatusMonitorRow>[] = [
  textColumn('name', 'Service'),
  textColumn('key', 'Key'),
  statusColumn('category', 'Category'),
  textColumn('url', 'URL'),
  statusColumn('state', 'State'),
  valueColumn('lastResponseMs', 'Response', (row) => `${row.lastResponseMs} ms`),
  dateColumn('lastCheckedAt', 'Last checked'),
  boolColumn('isActive', 'Shown'),
  actionsColumn(),
];
