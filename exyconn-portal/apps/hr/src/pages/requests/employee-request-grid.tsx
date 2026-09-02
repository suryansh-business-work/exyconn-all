import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListEmployeeRequestsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedEmployeeRequestRow =
  ListEmployeeRequestsPagedQuery['listEmployeeRequestsPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type EmployeeRequestGridContext = DatedCrudGridContext<PagedEmployeeRequestRow>;

/** Column model for the server-side Employee Requests grid. */
export const EMPLOYEE_REQUEST_COLUMNS: ColDef<PagedEmployeeRequestRow>[] = [
  textColumn('subject', 'Subject'),
  statusColumn('type', 'Type'),
  statusColumn('status', 'Status'),
  dateColumn('createdAt', 'Raised'),
  actionsColumn(),
];
