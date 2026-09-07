/** One billed line as it is stored — `amount` is derived, never written. */
export interface InvoiceLineInput {
  description: string;
  quantity: number;
  rate: number;
  taxPercent: number;
}

/** Money to two places — see the note on round2 in finance.billing.ts. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** What one line bills, tax included. */
export function lineAmount(line: InvoiceLineInput): number {
  return round2(line.quantity * line.rate * (1 + line.taxPercent / 100));
}

/** What the lines bill before tax. */
export function linesSubtotal(lines: readonly InvoiceLineInput[]): number {
  return round2(lines.reduce((total, line) => total + line.quantity * line.rate, 0));
}

/** The tax the lines add. */
export function linesTax(lines: readonly InvoiceLineInput[]): number {
  return round2(linesTotal(lines) - linesSubtotal(lines));
}

/** What the lines bill, tax included — the invoice's amount when it has lines. */
export function linesTotal(lines: readonly InvoiceLineInput[]): number {
  return round2(lines.reduce((total, line) => total + lineAmount(line), 0));
}

/**
 * The amount an invoice input resolves to.
 *
 * With lines, the amount IS the lines: a typed figure that disagreed with them would be a
 * lie on the document. Without lines the typed figure is the invoice — which is what every
 * invoice written before lines existed is.
 */
export function invoiceAmount(input: {
  lines?: readonly InvoiceLineInput[] | null;
  amount?: number | null;
}): number | null {
  if (input.lines && input.lines.length > 0) {
    return linesTotal(input.lines);
  }
  return input.amount ?? null;
}
