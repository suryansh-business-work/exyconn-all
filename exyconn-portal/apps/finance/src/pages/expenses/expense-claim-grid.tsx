import type { ColDef } from 'ag-grid-community';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListExpenseClaimsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedExpenseClaimRow =
  ListExpenseClaimsPagedQuery['listExpenseClaimsPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type ExpenseClaimGridContext = DatedCrudGridContext<PagedExpenseClaimRow>;

const APPROVE_ACTION: RowActionSpec = {
  key: 'approve',
  label: 'approve claim',
  icon: CheckCircleOutlineIcon,
  color: 'success',
};

const REJECT_ACTION: RowActionSpec = {
  key: 'reject',
  label: 'reject claim',
  icon: HighlightOffIcon,
  color: 'error',
};

const PAY_ACTION: RowActionSpec = {
  key: 'pay',
  label: 'mark paid',
  icon: PaidOutlinedIcon,
  color: 'primary',
};

/** What finance cleared, or a dash until a decision is made. */
const approvedLabel = (row: PagedExpenseClaimRow): string =>
  row.approvedAmount === null || row.approvedAmount === undefined
    ? '—'
    : String(row.approvedAmount);

/** Column model for the server-side Expense Claims grid. */
export const EXPENSE_CLAIM_COLUMNS: ColDef<PagedExpenseClaimRow>[] = [
  textColumn('category', 'Category'),
  textColumn('description', 'Description'),
  valueColumn('amount', 'Claimed', (row) => String(row.amount ?? '—')),
  valueColumn('approvedAmount', 'Approved', approvedLabel),
  statusColumn('status', 'Status'),
  dateColumn('incurredOn', 'Incurred'),
  actionsColumn([APPROVE_ACTION, REJECT_ACTION, PAY_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
