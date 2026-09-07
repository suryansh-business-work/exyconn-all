import type { ListInvoicesQuery, InvoiceStatus } from '@exyconn/shell/graphql/generated';

export type InvoiceRow = ListInvoicesQuery['listInvoices'][number];

/** One billed line as the form edits it. The amount is derived, never typed. */
export interface InvoiceLineValues {
  description: string;
  quantity: number;
  rate: number;
  taxPercent: number;
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
