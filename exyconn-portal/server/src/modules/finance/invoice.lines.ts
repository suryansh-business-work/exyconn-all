/** One billed line as it is stored — `amount` is derived, never written. */
export interface InvoiceLineInput {
  description: string;
  quantity: number;
  rate: number;
  taxPercent: number;
  /** The HSN (goods) or SAC (services) code a GST invoice prints per line. */
  hsnSac?: string;
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

/** The three GST heads an invoice's tax lands under, plus the figures they are cut from. */
export interface GstBreakdown {
  subtotal: number;
  taxTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  /** Supplier and place of supply are the same state: the tax is CGST + SGST. */
  intraState: boolean;
}

/** What the invoice needs to say for its tax to be split. */
export interface GstInvoice {
  lines?: readonly InvoiceLineInput[] | null;
  placeOfSupplyStateCode?: string | null;
  supplierStateCode?: string | null;
}

/**
 * Where the tax goes under GST.
 *
 * A supply inside the supplier's own state is taxed half as CGST (centre) and half as SGST
 * (state); a supply to another state is all IGST. The split is decided on state codes, so
 * an invoice with no place of supply — every invoice written before GST fields existed —
 * is treated as inter-state rather than guessed at. SGST is the remainder rather than a
 * second half, so the two halves always add back to the tax even on an odd paisa.
 */
export function gstBreakdown(invoice: GstInvoice): GstBreakdown {
  const lines = invoice.lines ?? [];
  const subtotal = linesSubtotal(lines);
  const taxTotal = linesTax(lines);
  const place = invoice.placeOfSupplyStateCode ?? '';
  const supplier = invoice.supplierStateCode ?? '';
  const intraState = place !== '' && place === supplier;
  if (!intraState) {
    return { subtotal, taxTotal, cgst: 0, sgst: 0, igst: taxTotal, intraState };
  }
  const cgst = round2(taxTotal / 2);
  return { subtotal, taxTotal, cgst, sgst: round2(taxTotal - cgst), igst: 0, intraState };
}
