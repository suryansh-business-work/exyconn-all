import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListLeavePoliciesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedLeavePolicyRow =
  ListLeavePoliciesPagedQuery['listLeavePoliciesPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type LeavePolicyGridContext = DatedCrudGridContext<PagedLeavePolicyRow>;

/** Column model for the server-side Leave Policies grid. */
export const LEAVE_POLICY_COLUMNS: ColDef<PagedLeavePolicyRow>[] = [
  textColumn('name', 'Policy'),
  textColumn('code', 'Code'),
  valueColumn('annualQuota', 'Quota', (row) => String(row.annualQuota ?? '—')),
  valueColumn('carryForwardCap', 'Carry fwd', (row) => String(row.carryForwardCap ?? '—')),
  boolColumn('active', 'Active'),
  actionsColumn(),
];
