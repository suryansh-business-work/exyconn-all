import { InvoiceStatus } from '@exyconn/shell/graphql/generated';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import type { ListInvoicesQuery } from '@exyconn/shell/graphql/generated';
import type { SelectOption } from '@exyconn/shell/components/form/rhf/types';

export type InvoiceRow = ListInvoicesQuery['listInvoices'][number];

/**
 * The only statuses a person decides. Everything else an invoice can read — part paid,
 * paid, overdue — is written by the server from the payments ledger and the due date, so
 * offering them in a dropdown only ever produced a figure the records disagreed with:
 * "overdue" on an invoice that is not, or "paid" against an empty ledger.
 */
const CHOSEN_STATUSES: InvoiceStatus[] = [InvoiceStatus.Draft, InvoiceStatus.Sent];

/**
 * What the status field offers.
 *
 * The invoice's own status is kept in the list when the server has moved it beyond a
 * person's two — otherwise opening an overdue invoice to fix a typo would show an empty
 * select and saving it would silently hand the invoice back to DRAFT.
 */
export function invoiceStatusOptions(current: InvoiceStatus | null): SelectOption[] {
  const derived = current && !CHOSEN_STATUSES.includes(current) ? [current] : [];
  return enumOptions([...CHOSEN_STATUSES, ...derived]);
}

/** One billed line as the form edits it. The amount is derived, never typed. */
export interface InvoiceLineValues {
  description: string;
  quantity: number;
  rate: number;
  taxPercent: number;
  /** HSN (goods) or SAC (services) code, printed per line on a GST invoice. */
  hsnSac: string;
}

export interface InvoiceFormValues {
  number: string;
  clientId: string;
  lines: InvoiceLineValues[];
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  /** Two-digit GST state code of the client's place of supply; blank when not set. */
  placeOfSupplyStateCode: string;
}

/** What one line bills, tax included — the same arithmetic the server settles the invoice on. */
export function lineAmount(line: InvoiceLineValues): number {
  const gross = line.quantity * line.rate * (1 + line.taxPercent / 100);
  return Math.round(gross * 100) / 100;
}

/** What the lines bill together. */
export function linesTotal(lines: readonly InvoiceLineValues[]): number {
  return Math.round(lines.reduce((total, line) => total + lineAmount(line), 0) * 100) / 100;
}
