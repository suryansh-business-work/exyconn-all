import PDFDocument from 'pdfkit';
import { payslipLines, type PayslipLine } from './payslip.lines';
import type { StructureParts } from './payroll.compute';

/** The statutory identifiers printed on a payslip, when the employer holds them. */
export interface PayslipIdentifiers {
  pfNumber: string;
  esiNumber: string;
  panNumber: string;
}

/** Everything one payslip prints, already resolved from the database. */
export interface PayslipData {
  company: { name: string; address: string; supportEmail: string };
  employee: {
    name: string;
    email: string;
    designation: string;
    department: string;
    joinDate: Date | null;
  };
  slip: {
    month: number;
    year: number;
    currency: string;
    gross: number;
    deductions: number;
    pf: number;
    esi: number;
    professionalTax: number;
    tds: number;
    net: number;
    status: string;
    issuedDate: Date;
  };
  structure: StructureParts | null;
  identifiers: PayslipIdentifiers;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** `August 2026` — the period a payslip covers, as it is printed and emailed. */
export function periodLabel(month: number, year: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

/** Money as the employee's own currency, e.g. `₹ 82,500.00`. */
export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}

const PAGE_MARGIN = 48;
const COLUMN_WIDTH = 240;
const COLUMN_GAP = 19;
const RIGHT_COLUMN = PAGE_MARGIN + COLUMN_WIDTH + COLUMN_GAP;
const ROW_HEIGHT = 15;
const INK = '#0f172a';
const MUTED = '#64748b';

/** Company block and the period this payslip covers. */
function drawHeader(doc: PDFKit.PDFDocument, data: PayslipData): void {
  doc.fillColor(INK).fontSize(18).text(data.company.name, { continued: false });
  doc.fillColor(MUTED).fontSize(9);
  if (data.company.address) {
    doc.text(data.company.address);
  }
  if (data.company.supportEmail) {
    doc.text(data.company.supportEmail);
  }
  doc.moveDown(1);
  doc
    .fillColor(INK)
    .fontSize(13)
    .text(`Payslip for ${periodLabel(data.slip.month, data.slip.year)}`);
  doc.moveDown(0.8);
}

/** One label/value line in the employee block. */
function drawField(doc: PDFKit.PDFDocument, label: string, value: string): void {
  doc.fillColor(MUTED).fontSize(9).text(label, { continued: true });
  doc.fillColor(INK).text(`  ${value}`);
}

/** The statutory numbers, each only when the employer actually holds it. */
function drawIdentifiers(doc: PDFKit.PDFDocument, identifiers: PayslipIdentifiers): void {
  const rows: Array<[string, string]> = [
    ['PF number', identifiers.pfNumber],
    ['ESI number', identifiers.esiNumber],
    ['PAN', identifiers.panNumber],
  ];
  for (const [label, value] of rows.filter(([, value]) => value)) {
    drawField(doc, label, value);
  }
}

function drawEmployee(doc: PDFKit.PDFDocument, data: PayslipData): void {
  const { employee, slip } = data;
  drawField(doc, 'Employee', employee.name);
  drawField(doc, 'Email', employee.email);
  if (employee.designation) {
    drawField(doc, 'Designation', employee.designation);
  }
  if (employee.department) {
    drawField(doc, 'Department', employee.department);
  }
  if (employee.joinDate) {
    drawField(doc, 'Joined', employee.joinDate.toISOString().slice(0, 10));
  }
  drawIdentifiers(doc, data.identifiers);
  drawField(doc, 'Payment status', slip.status);
  drawField(doc, 'Issued', slip.issuedDate.toISOString().slice(0, 10));
  doc.moveDown(1);
}

/** A label on the left of a column and its amount right-aligned at the column's edge. */
function drawRow(
  doc: PDFKit.PDFDocument,
  left: number,
  top: number,
  line: PayslipLine,
  currency: string,
): void {
  doc.fillColor(MUTED).text(line.label, left, top, { width: COLUMN_WIDTH - 80 });
  doc
    .fillColor(INK)
    .text(formatAmount(line.amount, currency), left, top, {
      align: 'right',
      width: COLUMN_WIDTH,
    });
}

/**
 * One titled column of amount rows with its own total, drawn from a fixed origin so the
 * Earnings and Deductions columns sit side by side however many rows each of them has.
 */
function drawColumn(
  doc: PDFKit.PDFDocument,
  left: number,
  top: number,
  title: string,
  lines: PayslipLine[],
  currency: string,
): number {
  doc.fillColor(INK).fontSize(11).text(title, left, top, { width: COLUMN_WIDTH });
  doc.fontSize(10);
  let cursor = top + 20;
  for (const line of lines) {
    drawRow(doc, left, cursor, line, currency);
    cursor += ROW_HEIGHT;
  }
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  cursor += 4;
  doc.moveTo(left, cursor).lineTo(left + COLUMN_WIDTH, cursor).strokeColor('#cbd5e1').stroke();
  cursor += 5;
  drawRow(doc, left, cursor, { label: `Total ${title.toLowerCase()}`, amount: total }, currency);
  return cursor + ROW_HEIGHT;
}

/** Earnings on the left, deductions on the right — a payslip anybody can check by eye. */
function drawBreakdown(doc: PDFKit.PDFDocument, data: PayslipData): void {
  const { earnings, deductions } = payslipLines(data.slip, data.structure);
  const top = doc.y;
  const currency = data.slip.currency;
  const earningsBottom = drawColumn(doc, PAGE_MARGIN, top, 'Earnings', earnings, currency);
  const deductionsBottom = drawColumn(doc, RIGHT_COLUMN, top, 'Deductions', deductions, currency);
  doc.y = Math.max(earningsBottom, deductionsBottom);
  doc.moveDown(1.5);
}

/** The net figure, set apart because it is the number the employee came for. */
function drawNet(doc: PDFKit.PDFDocument, data: PayslipData): void {
  const top = doc.y;
  doc.fillColor(INK).fontSize(12).text('Net pay', PAGE_MARGIN, top);
  doc
    .fontSize(12)
    .text(formatAmount(data.slip.net, data.slip.currency), RIGHT_COLUMN, top, {
      align: 'right',
      width: COLUMN_WIDTH,
    });
  doc.moveDown(1.5);
  doc
    .fillColor(MUTED)
    .fontSize(8)
    .text('This payslip is generated by the Exyconn portal and needs no signature.', PAGE_MARGIN, doc.y, {
      align: 'center',
      width: doc.page.width - PAGE_MARGIN * 2,
    });
}

/**
 * Renders one payslip as a PDF. The same document is what the employee downloads, what
 * HR downloads and what the scheduled email attaches — one renderer, so the three can
 * never disagree about what an employee was paid.
 */
export function buildPayslipPdf(data: PayslipData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  drawHeader(doc, data);
  drawEmployee(doc, data);
  drawBreakdown(doc, data);
  drawNet(doc, data);
  doc.end();

  return done;
}
