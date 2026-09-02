import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListExpenseClaimsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedExpenseClaimRow =
  ListExpenseClaimsPagedQuery['listExpenseClaimsPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type ExpenseClaimGridContext = DatedCrudGridContext<PagedExpenseClaimRow>;

/** Column model for the server-side Expense Claims grid. */
export const EXPENSE_CLAIM_COLUMNS: ColDef<PagedExpenseClaimRow>[] = [
  textColumn('category', 'Category'),
  textColumn('description', 'Description'),
  valueColumn('amount', 'Amount', (row) => String(row.amount ?? '—')),
  statusColumn('status', 'Status'),
  dateColumn('incurredOn', 'Incurred'),
  actionsColumn(),
];
