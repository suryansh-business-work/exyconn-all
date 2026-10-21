import type { ColDef } from 'ag-grid-community';
import { dateColumn, statusColumn, textColumn, valueColumn } from '@exyconn/crud';
import { activeFormatSettings, formatCurrency } from '@exyconn/i18n';
import type {
  ListInvoicesPagedQuery,
  ListPaymentsPagedQuery,
  ListSupportTicketsPagedQuery,
} from '@exyconn/shell/graphql/generated';

export type ClientInvoiceRow = ListInvoicesPagedQuery['listInvoicesPaged']['rows'][number];
export type ClientPaymentRow = ListPaymentsPagedQuery['listPaymentsPaged']['rows'][number];
export type ClientTicketRow =
  ListSupportTicketsPagedQuery['listSupportTicketsPaged']['rows'][number];

/** An amount in its own currency, in the company's number format. */
const money = (amount: number, currency: string) =>
  formatCurrency(amount, { ...activeFormatSettings(), currency });

export const INVOICE_COLUMNS: ColDef<ClientInvoiceRow>[] = [
  textColumn('number', 'Number'),
  statusColumn('status', 'Status'),
  valueColumn('amount', 'Amount', (row) => money(row.amount, row.currency)),
  valueColumn('balanceDue', 'Balance due', (row) => money(row.balanceDue, row.currency)),
  dateColumn('issuedDate', 'Issued'),
  dateColumn('dueDate', 'Due'),
];

export const PAYMENT_COLUMNS: ColDef<ClientPaymentRow>[] = [
  textColumn('invoiceNumber', 'Invoice'),
  valueColumn('amount', 'Amount', (row) => money(row.amount, row.currency)),
  textColumn('method', 'Method'),
  textColumn('reference', 'Reference'),
  dateColumn('receivedAt', 'Received'),
];

export const TICKET_COLUMNS: ColDef<ClientTicketRow>[] = [
  textColumn('reference', 'Reference'),
  textColumn('subject', 'Subject'),
  statusColumn('priority', 'Priority'),
  statusColumn('status', 'Status'),
  textColumn('assigneeName', 'Assignee'),
  dateColumn('createdAt', 'Raised'),
];
