import type { ColDef } from 'ag-grid-community';
import { actionsColumn, textColumn, valueColumn, type DatedCrudGridContext } from '@exyconn/crud';
import type { ListLeaveBalancesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedLeaveBalanceRow =
  ListLeaveBalancesPagedQuery['listLeaveBalancesPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type LeaveBalanceGridContext = DatedCrudGridContext<PagedLeaveBalanceRow>;

/** Column model for the server-side Leave Balances grid. */
export const LEAVE_BALANCE_COLUMNS: ColDef<PagedLeaveBalanceRow>[] = [
  textColumn('leaveTypeCode', 'Policy'),
  valueColumn('year', 'Year', (row) => String(row.year ?? '—')),
  valueColumn('allocated', 'Allocated', (row) => String(row.allocated ?? '—')),
  valueColumn('used', 'Used', (row) => String(row.used ?? '—')),
  valueColumn('available', 'Available', (row) => String(row.available ?? '—')),
  actionsColumn(),
];
