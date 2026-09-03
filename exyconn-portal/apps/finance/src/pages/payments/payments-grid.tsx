import type { ColDef } from 'ag-grid-community';
import { dateColumn, statusColumn, textColumn, valueColumn } from '@exyconn/crud';
import type { ListPaymentsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedPaymentRow = ListPaymentsPagedQuery['listPaymentsPaged']['rows'][number];

/** A refund is a negative receipt, and reads as one rather than as a smaller payment. */
function amountLabel(row: PagedPaymentRow): string {
  const money = `${row.currency} ${Math.abs(row.amount).toLocaleString()}`;
  return row.amount < 0 ? `− ${money} (refund)` : money;
}

/**
 * Column model for the payments ledger. There is no actions column: a payment records
 * something that happened, so a mistake is corrected by recording a refund against it,
 * never by editing history — the same contract the stock ledger keeps.
 */
export const PAYMENT_COLUMNS: ColDef<PagedPaymentRow>[] = [
  dateColumn('receivedAt', 'Received'),
  textColumn('invoiceNumber', 'Invoice'),
  valueColumn('amount', 'Amount', amountLabel),
  statusColumn('method', 'Method'),
  textColumn('reference', 'Reference'),
  textColumn('recordedBy', 'Recorded by'),
];
