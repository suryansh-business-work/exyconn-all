import PDFDocument from 'pdfkit';
import { lineAmount, linesSubtotal, linesTax, type InvoiceLineInput } from './invoice.lines';

/** Everything one invoice prints, already resolved from the database. */
export interface InvoicePdfData {
  company: { name: string; address: string; supportEmail: string };
  client: { name: string; company: string; email: string };
  invoice: {
    number: string;
    currency: string;
    status: string;
    issuedDate: Date;
    dueDate: Date;
    lines: InvoiceLineInput[];
    amount: number;
    amountPaid: number;
  };
}

/** Money in the invoice's own currency, e.g. `₹ 82,500.00`. */
export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}

/** `Invoice-INV-001.pdf` — safe for any filesystem and mail client. */
export function invoiceFilename(number: string): string {
  const safe = number.replaceAll(/[^\w-]+/g, '-').replaceAll(/^-+|-+$/g, '');
  return `Invoice-${safe || 'draft'}.pdf`;
}

const PAGE_MARGIN = 48;
const COLUMN_RIGHT = 400;
const INK = '#0f172a';
const MUTED = '#64748b';
const RULE = '#e2e8f0';

/** The line table's column x positions, left to right. */
const COLUMNS = { description: PAGE_MARGIN, quantity: 300, rate: 360, tax: 430, amount: 480 };

const isoDay = (date: Date): string => date.toISOString().slice(0, 10);

/** Company block and the invoice number. */
function drawHeader(doc: PDFKit.PDFDocument, data: InvoicePdfData): void {
  doc.fillColor(INK).fontSize(18).text(data.company.name);
  doc.fillColor(MUTED).fontSize(9);
  if (data.company.address) {
    doc.text(data.company.address);
  }
  if (data.company.supportEmail) {
    doc.text(data.company.supportEmail);
  }
  doc.moveDown(1);
  doc.fillColor(INK).fontSize(13).text(`Invoice ${data.invoice.number}`);
  doc.moveDown(0.8);
}

/** One label/value line. */
function drawField(doc: PDFKit.PDFDocument, label: string, value: string): void {
  doc.fillColor(MUTED).fontSize(9).text(label, { continued: true });
  doc.fillColor(INK).text(`  ${value}`);
}

function drawParties(doc: PDFKit.PDFDocument, data: InvoicePdfData): void {
  const { client, invoice } = data;
  drawField(doc, 'Billed to', client.company ? `${client.name}, ${client.company}` : client.name);
  if (client.email) {
    drawField(doc, 'Email', client.email);
  }
  drawField(doc, 'Issued', isoDay(invoice.issuedDate));
  drawField(doc, 'Due', isoDay(invoice.dueDate));
  drawField(doc, 'Status', invoice.status.replaceAll('_', ' '));
  doc.moveDown(1);
}

/** A right-aligned cell of the line table. */
function cell(doc: PDFKit.PDFDocument, text: string, x: number, top: number, width: number): void {
  doc.text(text, x, top, { width, align: 'right' });
}

/** One row of the line table: description, quantity, rate, tax and the line's amount. */
function drawLine(doc: PDFKit.PDFDocument, line: InvoiceLineInput, currency: string): void {
  const top = doc.y;
  doc.fillColor(INK).text(line.description, COLUMNS.description, top, { width: 240 });
  const rowBottom = doc.y;
  cell(doc, String(line.quantity), COLUMNS.quantity, top, 50);
  cell(doc, formatAmount(line.rate, currency), COLUMNS.rate, top, 65);
  cell(doc, `${line.taxPercent}%`, COLUMNS.tax, top, 40);
  cell(doc, formatAmount(lineAmount(line), currency), COLUMNS.amount, top, 67);
  doc.y = Math.max(doc.y, rowBottom);
}

/** The line table, or nothing when the invoice was written as a single figure. */
function drawLines(doc: PDFKit.PDFDocument, data: InvoicePdfData): void {
  const { lines, currency } = data.invoice;
  if (lines.length === 0) {
    return;
  }
  const top = doc.y;
  doc.fillColor(MUTED).fontSize(9);
  doc.text('Description', COLUMNS.description, top);
  cell(doc, 'Qty', COLUMNS.quantity, top, 50);
  cell(doc, 'Rate', COLUMNS.rate, top, 65);
  cell(doc, 'Tax', COLUMNS.tax, top, 40);
  cell(doc, 'Amount', COLUMNS.amount, top, 67);
  doc.moveTo(PAGE_MARGIN, doc.y + 2)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y + 2)
    .strokeColor(RULE)
    .stroke();
  doc.moveDown(0.5);
  doc.fontSize(10);
  for (const line of lines) {
    drawLine(doc, line, currency);
    doc.moveDown(0.3);
  }
  doc.moveDown(0.5);
}

/** One row of the totals block. */
function drawTotal(doc: PDFKit.PDFDocument, label: string, value: string, size = 10): void {
  const top = doc.y;
  doc.fillColor(MUTED).fontSize(size).text(label, COLUMN_RIGHT - 100, top, { width: 100 });
  doc.fillColor(INK).fontSize(size).text(value, COLUMN_RIGHT, top, {
    align: 'right',
    width: doc.page.width - COLUMN_RIGHT - PAGE_MARGIN,
  });
}

/** Subtotal, tax, total, what has been paid and what is still owed. */
function drawTotals(doc: PDFKit.PDFDocument, data: InvoicePdfData): void {
  const { lines, currency, amount, amountPaid } = data.invoice;
  if (lines.length > 0) {
    drawTotal(doc, 'Subtotal', formatAmount(linesSubtotal(lines), currency));
    drawTotal(doc, 'Tax', formatAmount(linesTax(lines), currency));
  }
  drawTotal(doc, 'Total', formatAmount(amount, currency), 12);
  drawTotal(doc, 'Amount paid', formatAmount(amountPaid, currency));
  drawTotal(doc, 'Balance due', formatAmount(amount - amountPaid, currency), 12);
  doc.moveDown(1.5);
  doc
    .fillColor(MUTED)
    .fontSize(8)
    .text('This invoice is generated by the Exyconn portal.', PAGE_MARGIN, doc.y, {
      align: 'center',
      width: doc.page.width - 2 * PAGE_MARGIN,
    });
}

/**
 * Renders one invoice as a PDF. The same document is what Finance downloads and what
 * `sendInvoice` attaches — one renderer, so the two can never disagree about what the
 * client was billed.
 */
export function buildInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  drawHeader(doc, data);
  drawParties(doc, data);
  drawLines(doc, data);
  drawTotals(doc, data);
  doc.end();

  return done;
}
