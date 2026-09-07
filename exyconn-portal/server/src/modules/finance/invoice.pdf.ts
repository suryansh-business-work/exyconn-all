import PDFDocument from 'pdfkit';
import {
  invoiceDocument,
  type DocumentField,
  type DocumentLine,
  type InvoiceDocument,
  type InvoicePdfData,
} from './invoice.document';

export { formatAmount, type InvoicePdfData } from './invoice.document';

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

/** The line table's columns, left to right: where each starts and how wide it is. */
const COLUMNS = {
  description: { x: PAGE_MARGIN, width: 190 },
  hsnSac: { x: 243, width: 52 },
  quantity: { x: 300, width: 40 },
  rate: { x: 345, width: 70 },
  tax: { x: 420, width: 40 },
  amount: { x: 465, width: 82 },
} as const;

/** Company block, the title and the invoice number. */
function drawHeader(doc: PDFKit.PDFDocument, document: InvoiceDocument): void {
  const [name, ...details] = document.supplier;
  doc.fillColor(INK).fontSize(18).text(name);
  doc.fillColor(MUTED).fontSize(9);
  for (const line of details) {
    doc.text(line);
  }
  doc.moveDown(1);
  doc.fillColor(INK).fontSize(13).text(`${document.title} ${document.number}`);
  doc.moveDown(0.8);
}

/** One label/value line. */
function drawField(doc: PDFKit.PDFDocument, field: DocumentField): void {
  doc.fillColor(MUTED).fontSize(9).text(field.label, { continued: true });
  doc.fillColor(INK).text(`  ${field.value}`);
}

function drawParties(doc: PDFKit.PDFDocument, document: InvoiceDocument): void {
  for (const field of document.parties) {
    drawField(doc, field);
  }
  doc.moveDown(1);
}

/** A right-aligned cell of the line table. */
function cell(doc: PDFKit.PDFDocument, text: string, column: keyof typeof COLUMNS, top: number) {
  const { x, width } = COLUMNS[column];
  doc.text(text, x, top, { width, align: 'right' });
}

/** One row of the line table. The description may wrap; the row is as tall as it needs. */
function drawLine(doc: PDFKit.PDFDocument, line: DocumentLine): void {
  const top = doc.y;
  doc.fillColor(INK).text(line.description, COLUMNS.description.x, top, {
    width: COLUMNS.description.width,
  });
  const rowBottom = doc.y;
  cell(doc, line.hsnSac, 'hsnSac', top);
  cell(doc, line.quantity, 'quantity', top);
  cell(doc, line.rate, 'rate', top);
  cell(doc, line.tax, 'tax', top);
  cell(doc, line.amount, 'amount', top);
  doc.y = Math.max(doc.y, rowBottom);
}

/** The line table, or nothing when the invoice was written as a single figure. */
function drawLines(doc: PDFKit.PDFDocument, document: InvoiceDocument): void {
  if (document.lines.length === 0) {
    return;
  }
  const top = doc.y;
  doc.fillColor(MUTED).fontSize(9);
  doc.text('Description', COLUMNS.description.x, top);
  cell(doc, 'HSN/SAC', 'hsnSac', top);
  cell(doc, 'Qty', 'quantity', top);
  cell(doc, 'Rate', 'rate', top);
  cell(doc, 'Tax', 'tax', top);
  cell(doc, 'Amount', 'amount', top);
  doc.moveTo(PAGE_MARGIN, doc.y + 2)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y + 2)
    .strokeColor(RULE)
    .stroke();
  doc.moveDown(0.5);
  doc.fontSize(10);
  for (const line of document.lines) {
    drawLine(doc, line);
    doc.moveDown(0.3);
  }
  doc.moveDown(0.5);
}

/** One row of the totals block. */
function drawTotal(doc: PDFKit.PDFDocument, field: DocumentField): void {
  const size = field.emphasis ? 12 : 10;
  const top = doc.y;
  doc.fillColor(MUTED).fontSize(size).text(field.label, COLUMN_RIGHT - 100, top, { width: 100 });
  doc.fillColor(INK).fontSize(size).text(field.value, COLUMN_RIGHT, top, {
    align: 'right',
    width: doc.page.width - COLUMN_RIGHT - PAGE_MARGIN,
  });
}

/** Where to pay, when Branding says. */
function drawBankDetails(doc: PDFKit.PDFDocument, document: InvoiceDocument): void {
  if (!document.bankDetails) {
    return;
  }
  doc.moveDown(1);
  doc.fillColor(MUTED).fontSize(9).text('Bank details', PAGE_MARGIN, doc.y);
  doc.fillColor(INK).fontSize(10).text(document.bankDetails, PAGE_MARGIN, doc.y, {
    width: doc.page.width - 2 * PAGE_MARGIN,
  });
}

function drawTotals(doc: PDFKit.PDFDocument, document: InvoiceDocument): void {
  for (const field of document.totals) {
    drawTotal(doc, field);
  }
  drawBankDetails(doc, document);
  doc.moveDown(1.5);
  doc
    .fillColor(MUTED)
    .fontSize(8)
    .text(document.footer, PAGE_MARGIN, doc.y, {
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
  const document = invoiceDocument(data);
  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  drawHeader(doc, document);
  drawParties(doc, document);
  drawLines(doc, document);
  drawTotals(doc, document);
  doc.end();

  return done;
}
