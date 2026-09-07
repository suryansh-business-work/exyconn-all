import type { ColDef } from 'ag-grid-community';
import { actionsColumn, textColumn, valueColumn } from '@exyconn/crud';
import { employeeNameColumn, type NamedGridContext } from '../../grid/employee-name-column';
import type { ListLeaveBalancesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedLeaveBalanceRow =
  ListLeaveBalancesPagedQuery['listLeaveBalancesPaged']['rows'][number];

/** Row handlers, the date formatter and the employee-name lookup ag-grid hands to shared cells. */
export type LeaveBalanceGridContext = NamedGridContext<PagedLeaveBalanceRow>;

/** Column model for the server-side Leave Balances grid. */
export const LEAVE_BALANCE_COLUMNS: ColDef<PagedLeaveBalanceRow>[] = [
  employeeNameColumn(),
  textColumn('leaveTypeCode', 'Policy'),
  valueColumn('year', 'Year', (row) => String(row.year ?? '—')),
  valueColumn('allocated', 'Allocated', (row) => String(row.allocated ?? '—')),
  valueColumn('used', 'Used', (row) => String(row.used ?? '—')),
  valueColumn('available', 'Available', (row) => String(row.available ?? '—')),
  actionsColumn(),
];
