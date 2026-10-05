import type { ColDef } from 'ag-grid-community';
import PaymentIcon from '@mui/icons-material/Payment';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import {
  actionsColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ClientHubInvoicesQuery } from '@exyconn/shell/graphql/generated';
import { balanceOf, money } from '../money';

export type ClientInvoiceRow = ClientHubInvoicesQuery['clientHubInvoices']['rows'][number];
export type InvoicesGridContext = DatedCrudGridContext<ClientInvoiceRow>;

export const PAY_ACTION: RowActionSpec = {
  key: 'pay',
  label: 'pay online',
  icon: PaymentIcon,
  color: 'success',
  hidden: (row: ClientInvoiceRow) => balanceOf(row) <= 0,
};
const DOWNLOAD_ACTION: RowActionSpec = {
  key: 'download',
  label: 'download PDF',
  icon: DownloadIcon,
  color: 'primary',
};
const EMAIL_ACTION: RowActionSpec = {
  key: 'email',
  label: 'email me this invoice',
  icon: EmailIcon,
  color: 'primary',
};

/** The client's invoices: what each was for, what is still owed, and the three things to do. */
export const INVOICE_COLUMNS: ColDef<ClientInvoiceRow>[] = [
  textColumn('number', 'Invoice'),
  dateColumn('issuedDate', 'Issued'),
  dateColumn('dueDate', 'Due'),
  valueColumn('amount', 'Amount', (row) => money(row.amount, row.currency)),
  valueColumn('amountPaid', 'Paid', (row) => money(row.amountPaid ?? 0, row.currency)),
  derivedColumn('balance', 'Balance due', (row) => money(balanceOf(row), row.currency)),
  statusColumn('status', 'Status'),
  actionsColumn([PAY_ACTION, DOWNLOAD_ACTION, EMAIL_ACTION]),
];
