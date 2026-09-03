import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  DELETE_ACTION,
  EDIT_ACTION,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import type { ListCompanyExpensesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedCompanyExpenseRow =
  ListCompanyExpensesPagedQuery['listCompanyExpensesPaged']['rows'][number];

/** The page adds a `settle` handler alongside the standard edit/delete pair. */
export type CompanyExpensesGridContext = DatedCrudGridContext<PagedCompanyExpenseRow>;

/** Settling is what a bill register is for, so it sits first — and only where it applies. */
const SETTLE_ACTION = {
  key: 'settle',
  label: 'mark paid',
  icon: PaidOutlinedIcon,
  hidden: (row: PagedCompanyExpenseRow) => row.status === 'PAID',
};

/** Whole days past the due date. Zero or less means it is not late yet. */
function daysLate(dueDate: string): number {
  return Math.floor((Date.now() - new Date(dueDate).getTime()) / 86_400_000);
}

/**
 * Due date, saying whether it has passed.
 *
 * A settled bill's due date is history and reads plainly; an unpaid one that is late is the
 * only thing on this grid that needs anybody to do something today.
 */
function dueLabel(row: PagedCompanyExpenseRow, formatted: string): string {
  if (row.status === 'PAID') {
    return formatted;
  }
  const late = daysLate(row.dueDate);
  return late > 0 ? `${formatted} · ${late}d late` : formatted;
}

/** Column model for the company expenses register. */
export function companyExpenseColumns(
  formatDate: (value: string) => string,
): ColDef<PagedCompanyExpenseRow>[] {
  return [
    textColumn('vendor', 'Vendor'),
    statusColumn('category', 'Category'),
    valueColumn('amount', 'Amount', (row) => `${row.currency} ${row.amount.toLocaleString()}`),
    dateColumn('incurredOn', 'Incurred'),
    valueColumn('dueDate', 'Due', (row) => dueLabel(row, formatDate(row.dueDate))),
    statusColumn('status', 'Status'),
    actionsColumn([SETTLE_ACTION, EDIT_ACTION, DELETE_ACTION]),
  ];
}
