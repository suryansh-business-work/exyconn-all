import type { ColDef } from 'ag-grid-community';
import { dateColumn, textColumn, valueColumn, type DatedCrudGridContext } from '@exyconn/crud';
import type { ClientHubPaymentsQuery } from '@exyconn/shell/graphql/generated';
import { money } from '../money';

export type ClientPaymentRow = ClientHubPaymentsQuery['clientHubPayments']['rows'][number];
export type PaymentsGridContext = DatedCrudGridContext<ClientPaymentRow>;

/** Every payment received from the client — online or otherwise. A refund shows negative. */
export const PAYMENT_COLUMNS: ColDef<ClientPaymentRow>[] = [
  dateColumn('receivedAt', 'Date'),
  textColumn('invoiceNumber', 'Invoice'),
  valueColumn('amount', 'Amount', (row) => money(row.amount, row.currency)),
  textColumn('method', 'Method'),
  textColumn('reference', 'Reference'),
];
