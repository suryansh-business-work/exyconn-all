import type { ColDef } from 'ag-grid-community';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
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
import type { RecurringInvoiceRow } from './forms/recurring-invoice';

export type { RecurringInvoiceRow };

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type RecurringInvoicesGridContext = DatedCrudGridContext<RecurringInvoiceRow>;

const RUN_NOW_ACTION: RowActionSpec = {
  key: 'runNow',
  label: 'raise this period now',
  icon: PlayArrowIcon,
  color: 'primary',
};

/** How often a retainer bills, in words rather than the stored enum. */
const FREQUENCY_LABEL: Record<string, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

export const RECURRING_INVOICE_COLUMNS: ColDef<RecurringInvoiceRow>[] = [
  textColumn('name', 'Name'),
  textColumn('clientName', 'Client', (row) => row.clientName || row.clientId),
  valueColumn('amount', 'Each period', (row) => `${row.currency} ${row.amount.toLocaleString()}`),
  valueColumn('frequency', 'Bills', (row) => FREQUENCY_LABEL[row.frequency] ?? row.frequency),
  dateColumn('nextRunAt', 'Next invoice'),
  // The answer to "is this thing actually working".
  valueColumn('generatedCount', 'Raised', (row) => String(row.generatedCount)),
  statusColumn('active', 'State', (row) => (row.active ? 'ACTIVE' : 'PAUSED')),
  actionsColumn([RUN_NOW_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
