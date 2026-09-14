import { gstBreakdown, lineAmount, type InvoiceLineInput } from './invoice.lines';
import { gstStateLabel } from './gst.constants';

/** Everything one invoice prints, already resolved from the database. */
export interface InvoicePdfData {
  /** The company's own language: what its money and numbers are written in (BCP 47). */
  locale: string;
  /**
   * Whether this company bills under India's GST. Only then does the document carry GSTINs,
   * a place of supply, HSN/SAC codes and CGST/SGST/IGST heads — everywhere else those are
   * meaningless, and printing empty ones would make a foreign invoice look malformed.
   */
  indianTaxRules: boolean;
  company: {
    name: string;
    address: string;
    supportEmail: string;
    gstin: string;
    stateCode: string;
    bankDetails: string;
  };
  client: { name: string; company: string; email: string; gstin: string; billingAddress: string };
  invoice: {
    number: string;
    currency: string;
    status: string;
    issuedDate: Date;
    dueDate: Date;
    lines: InvoiceLineInput[];
    amount: number;
    amountPaid: number;
    placeOfSupplyStateCode: string;
    supplierStateCode: string;
  };
}

/** A label and what it says, as the parties block and the totals block print them. */
export interface DocumentField {
  label: string;
  value: string;
  /** Printed larger: the grand total and the balance due. */
  emphasis?: boolean;
}

/** One row of the line table, every cell already formatted. */
export interface DocumentLine {
  description: string;
  hsnSac: string;
  quantity: string;
  rate: string;
  tax: string;
  amount: string;
}

/** The invoice as text, in the order it is laid out. Nothing here knows about PDFs. */
export interface InvoiceDocument {
  title: string;
  number: string;
  /** Who is billing: name, then address, GSTIN and email as far as they are known. */
  supplier: string[];
  parties: DocumentField[];
  lines: DocumentLine[];
  totals: DocumentField[];
  bankDetails: string;
  footer: string;
}

/**
 * Money in the invoice's own currency, written in the company's own notation — "₹ 82,500.00"
 * for a company reading in India, "82.500,00 €" for one reading in Germany.
 */
export function formatAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

const isoDay = (date: Date): string => date.toISOString().slice(0, 10);

/** Only the lines the supplier can fill in; a blank GSTIN prints nothing, not "GSTIN:". */
function supplierBlock(company: InvoicePdfData['company'], indianTaxRules: boolean): string[] {
  const block = [company.name];
  if (company.address) {
    block.push(company.address);
  }
  if (indianTaxRules && company.gstin) {
    block.push(`GSTIN: ${company.gstin}`);
  }
  if (company.supportEmail) {
    block.push(company.supportEmail);
  }
  return block;
}

function partiesBlock({ client, invoice, indianTaxRules }: InvoicePdfData): DocumentField[] {
  const fields: DocumentField[] = [
    {
      label: 'Billed to',
      value: client.company ? `${client.name}, ${client.company}` : client.name,
    },
  ];
  if (indianTaxRules && client.gstin) {
    fields.push({ label: 'Client GSTIN', value: client.gstin });
  }
  if (client.billingAddress) {
    fields.push({ label: 'Billing address', value: client.billingAddress });
  }
  if (client.email) {
    fields.push({ label: 'Email', value: client.email });
  }
  if (indianTaxRules && invoice.placeOfSupplyStateCode) {
    fields.push({ label: 'Place of supply', value: gstStateLabel(invoice.placeOfSupplyStateCode) });
  }
  fields.push(
    { label: 'Issued', value: isoDay(invoice.issuedDate) },
    { label: 'Due', value: isoDay(invoice.dueDate) },
    { label: 'Status', value: invoice.status.replaceAll('_', ' ') },
  );
  return fields;
}

function lineRow(
  line: InvoiceLineInput,
  currency: string,
  locale: string,
  indianTaxRules: boolean,
): DocumentLine {
  return {
    description: line.description,
    hsnSac: indianTaxRules ? (line.hsnSac ?? '') : '',
    quantity: String(line.quantity),
    rate: formatAmount(line.rate, currency, locale),
    tax: `${line.taxPercent}%`,
    amount: formatAmount(lineAmount(line), currency, locale),
  };
}

/**
 * The tax rows. With a place of supply the tax is shown under its GST heads — CGST and
 * SGST inside our state, IGST outside it; without one (an invoice written before GST
 * fields existed) it is the single "Tax" row it always was.
 */
function taxRows(
  invoice: InvoicePdfData['invoice'],
  locale: string,
  indianTaxRules: boolean,
): DocumentField[] {
  const money = (value: number) => formatAmount(value, invoice.currency, locale);
  const gst = gstBreakdown(invoice);
  if (!indianTaxRules || !invoice.placeOfSupplyStateCode) {
    return [{ label: 'Tax', value: money(gst.taxTotal) }];
  }
  if (gst.intraState) {
    return [
      { label: 'CGST', value: money(gst.cgst) },
      { label: 'SGST', value: money(gst.sgst) },
    ];
  }
  return [{ label: 'IGST', value: money(gst.igst) }];
}

/** Subtotal, tax, total, what has been paid and what is still owed. */
function totalsBlock(
  invoice: InvoicePdfData['invoice'],
  locale: string,
  indianTaxRules: boolean,
): DocumentField[] {
  const money = (value: number) => formatAmount(value, invoice.currency, locale);
  const totals: DocumentField[] = [];
  if (invoice.lines.length > 0) {
    totals.push(
      { label: 'Subtotal', value: money(gstBreakdown(invoice).subtotal) },
      ...taxRows(invoice, locale, indianTaxRules),
    );
  }
  totals.push(
    { label: 'Total', value: money(invoice.amount), emphasis: true },
    { label: 'Amount paid', value: money(invoice.amountPaid) },
    { label: 'Balance due', value: money(invoice.amount - invoice.amountPaid), emphasis: true },
  );
  return totals;
}

/**
 * Lays the invoice out as text. This is the whole decision about what the document says —
 * the PDF renderer only draws it — so a test can assert on the GSTIN or the tax heads
 * without reading bytes back out of a PDF.
 */
export function invoiceDocument(data: InvoicePdfData): InvoiceDocument {
  const { company, invoice, locale, indianTaxRules } = data;
  return {
    // "Tax Invoice" is what India's rules oblige the document to call itself; elsewhere the
    // word carries no such meaning, and the document is simply an invoice.
    title: indianTaxRules ? 'Tax Invoice' : 'Invoice',
    number: invoice.number,
    supplier: supplierBlock(company, indianTaxRules),
    parties: partiesBlock(data),
    lines: invoice.lines.map((line) => lineRow(line, invoice.currency, locale, indianTaxRules)),
    totals: totalsBlock(invoice, locale, indianTaxRules),
    bankDetails: company.bankDetails,
    footer: `This invoice is generated by the ${company.name} portal.`,
  };
}
