import { gstBreakdown, lineAmount, type InvoiceLineInput } from './invoice.lines';
import { gstStateLabel } from './gst.constants';

/** Everything one invoice prints, already resolved from the database. */
export interface InvoicePdfData {
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

/** Money in the invoice's own currency, e.g. `₹ 82,500.00`. */
export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}

const isoDay = (date: Date): string => date.toISOString().slice(0, 10);

/** Only the lines the supplier can fill in; a blank GSTIN prints nothing, not "GSTIN:". */
function supplierBlock(company: InvoicePdfData['company']): string[] {
  const block = [company.name];
  if (company.address) {
    block.push(company.address);
  }
  if (company.gstin) {
    block.push(`GSTIN: ${company.gstin}`);
  }
  if (company.supportEmail) {
    block.push(company.supportEmail);
  }
  return block;
}

function partiesBlock({ client, invoice }: InvoicePdfData): DocumentField[] {
  const fields: DocumentField[] = [
    {
      label: 'Billed to',
      value: client.company ? `${client.name}, ${client.company}` : client.name,
    },
  ];
  if (client.gstin) {
    fields.push({ label: 'Client GSTIN', value: client.gstin });
  }
  if (client.billingAddress) {
    fields.push({ label: 'Billing address', value: client.billingAddress });
  }
  if (client.email) {
    fields.push({ label: 'Email', value: client.email });
  }
  if (invoice.placeOfSupplyStateCode) {
    fields.push({ label: 'Place of supply', value: gstStateLabel(invoice.placeOfSupplyStateCode) });
  }
  fields.push(
    { label: 'Issued', value: isoDay(invoice.issuedDate) },
    { label: 'Due', value: isoDay(invoice.dueDate) },
    { label: 'Status', value: invoice.status.replaceAll('_', ' ') },
  );
  return fields;
}

function lineRow(line: InvoiceLineInput, currency: string): DocumentLine {
  return {
    description: line.description,
    hsnSac: line.hsnSac ?? '',
    quantity: String(line.quantity),
    rate: formatAmount(line.rate, currency),
    tax: `${line.taxPercent}%`,
    amount: formatAmount(lineAmount(line), currency),
  };
}

/**
 * The tax rows. With a place of supply the tax is shown under its GST heads — CGST and
 * SGST inside our state, IGST outside it; without one (an invoice written before GST
 * fields existed) it is the single "Tax" row it always was.
 */
function taxRows(invoice: InvoicePdfData['invoice']): DocumentField[] {
  const money = (value: number) => formatAmount(value, invoice.currency);
  const gst = gstBreakdown(invoice);
  if (!invoice.placeOfSupplyStateCode) {
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
function totalsBlock(invoice: InvoicePdfData['invoice']): DocumentField[] {
  const money = (value: number) => formatAmount(value, invoice.currency);
  const totals: DocumentField[] = [];
  if (invoice.lines.length > 0) {
    totals.push(
      { label: 'Subtotal', value: money(gstBreakdown(invoice).subtotal) },
      ...taxRows(invoice),
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
  const { company, invoice } = data;
  return {
    title: 'Tax Invoice',
    number: invoice.number,
    supplier: supplierBlock(company),
    parties: partiesBlock(data),
    lines: invoice.lines.map((line) => lineRow(line, invoice.currency)),
    totals: totalsBlock(invoice),
    bankDetails: company.bankDetails,
    footer: `This invoice is generated by the ${company.name} portal.`,
  };
}
