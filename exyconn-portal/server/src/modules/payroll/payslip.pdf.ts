import PDFDocument from 'pdfkit';
import { payslipLines, type PayslipLine } from './payslip.lines';
import { drawLogo, logoHeight, registerFonts, FONTS } from './payslip.brand';
import {
  ACCENT,
  COLUMN_WIDTH,
  CONTENT_WIDTH,
  INK,
  MARGIN,
  MUTED,
  PAGE,
  PANEL,
  RIGHT_COLUMN,
  ROW_HEIGHT,
  SECTION_TITLE_HEIGHT,
  SPACE,
  TEXT,
  labelledRow,
  panel,
  rowHeight,
  rule,
  sectionTitle,
} from './payslip.layout';
import type { StructureParts } from './payroll.compute';

/** The statutory identifiers printed on a payslip, when the employer holds them. */
export interface PayslipIdentifiers {
  pfNumber: string;
  esiNumber: string;
  panNumber: string;
}

/** Everything one payslip prints, already resolved from the database. */
export interface PayslipData {
  company: { name: string; address: string; supportEmail: string; hrEmail: string };
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

/** A calendar day as ISO 8601 `2026-08-31`, which is unambiguous in every country. */
function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const LOGO_WIDTH = 118;

/**
 * The letterhead: the logo and who issued the payslip on the left, what the document is
 * and the month it covers on the right. Returns the y the body starts at.
 */
function drawHeader(doc: PDFKit.PDFDocument, data: PayslipData): number {
  const top = MARGIN;
  drawLogo(doc, MARGIN, top, LOGO_WIDTH);

  let left = top + logoHeight(LOGO_WIDTH) + SPACE.md;
  doc.font(FONTS.bold).fontSize(TEXT.heading).fillColor(INK).text(data.company.name, MARGIN, left);
  left = doc.y + 2;
  if (data.company.address) {
    doc
      .font(FONTS.regular)
      .fontSize(TEXT.small)
      .fillColor(MUTED)
      .text(data.company.address, MARGIN, left, { width: COLUMN_WIDTH });
    left = doc.y;
  }

  doc
    .font(FONTS.bold)
    .fontSize(TEXT.title)
    .fillColor(INK)
    .text('PAYSLIP', MARGIN, top, { width: CONTENT_WIDTH, align: 'right' });
  doc
    .font(FONTS.regular)
    .fontSize(TEXT.body)
    .fillColor(MUTED)
    .text(periodLabel(data.slip.month, data.slip.year), MARGIN, top + 26, {
      width: CONTENT_WIDTH,
      align: 'right',
    });
  doc.fontSize(TEXT.caption).text('Private & confidential', MARGIN, top + 40, {
    width: CONTENT_WIDTH,
    align: 'right',
  });

  const bottom = Math.max(left, top + 54) + SPACE.md;
  rule(doc, MARGIN, bottom, CONTENT_WIDTH, ACCENT);
  return bottom + SPACE.lg;
}

/** Only the identifiers the employer actually holds are worth a line on the page. */
function identifierRows(data: PayslipData): Array<[string, string]> {
  const { identifiers } = data;
  return (
    [
      ['PF number', identifiers.pfNumber],
      ['ESI number', identifiers.esiNumber],
      ['PAN', identifiers.panNumber],
    ] as Array<[string, string]>
  ).filter(([, value]) => value !== '');
}

/** Who the payslip is for, on the left; what it is and when it was issued, on the right. */
function employeeRows(data: PayslipData): Array<[string, string]> {
  const { employee } = data;
  return (
    [
      ['Employee', employee.name],
      ['Email', employee.email],
      ['Designation', employee.designation],
      ['Department', employee.department],
      ['Date of joining', employee.joinDate ? isoDate(employee.joinDate) : ''],
    ] as Array<[string, string]>
  ).filter(([, value]) => value !== '');
}

/** Draws label/value rows down a column and returns the y just past the last one. */
function drawRows(
  doc: PDFKit.PDFDocument,
  left: number,
  top: number,
  rows: Array<[string, string]>,
): number {
  let cursor = top;
  for (const [label, value] of rows) {
    cursor += labelledRow(doc, left, cursor, COLUMN_WIDTH, label, value);
  }
  return cursor;
}

/**
 * The two detail columns. Both start at the same y and the block ends below whichever
 * ran longer, so a missing PF number cannot leave the earnings table hanging.
 */
function drawDetails(doc: PDFKit.PDFDocument, top: number, data: PayslipData): number {
  const leftTop = sectionTitle(doc, MARGIN, top, COLUMN_WIDTH, 'Employee');
  const rightTop = sectionTitle(doc, RIGHT_COLUMN, top, COLUMN_WIDTH, 'Pay period');

  const payRows: Array<[string, string]> = [
    ['Pay period', periodLabel(data.slip.month, data.slip.year)],
    ['Payment status', data.slip.status],
    ['Date of issue', isoDate(data.slip.issuedDate)],
    ...identifierRows(data),
  ];

  const leftBottom = drawRows(doc, MARGIN, leftTop, employeeRows(data));
  const rightBottom = drawRows(doc, RIGHT_COLUMN, rightTop, payRows);
  return Math.max(leftBottom, rightBottom) + SPACE.lg;
}

/** Amounts are short and fixed-width; labels get everything the amount does not need. */
const AMOUNT_WIDTH = 86;

/** How tall a breakdown column has to be to hold its rows, its heading and its total. */
function columnHeight(doc: PDFKit.PDFDocument, lines: PayslipLine[], currency: string): number {
  const innerWidth = COLUMN_WIDTH - SPACE.md * 2;
  const rows = lines.reduce(
    (total, line) =>
      total +
      rowHeight(doc, innerWidth, line.label, formatAmount(line.amount, currency), AMOUNT_WIDTH),
    0,
  );
  return SPACE.md + SECTION_TITLE_HEIGHT + rows + SPACE.sm + ROW_HEIGHT + SPACE.md;
}

/**
 * One titled column of amounts inside its own panel, ruled off from a total.
 *
 * Both columns are drawn to the same height and the total is hung off the panel's floor
 * rather than off the last row, so the two totals sit on one line even when earnings has
 * three components and deductions has six.
 */
function drawBreakdownColumn(
  doc: PDFKit.PDFDocument,
  left: number,
  top: number,
  height: number,
  title: string,
  lines: PayslipLine[],
  currency: string,
): void {
  panel(doc, left, top, COLUMN_WIDTH, height);
  const inner = left + SPACE.md;
  const innerWidth = COLUMN_WIDTH - SPACE.md * 2;

  let cursor = sectionTitle(doc, inner, top + SPACE.md, innerWidth, title);
  for (const line of lines) {
    cursor += labelledRow(
      doc,
      inner,
      cursor,
      innerWidth,
      line.label,
      formatAmount(line.amount, currency),
      AMOUNT_WIDTH,
    );
  }

  const totalTop = top + height - SPACE.md - ROW_HEIGHT;
  rule(doc, inner, totalTop - SPACE.sm, innerWidth);
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  labelledRow(
    doc,
    inner,
    totalTop,
    innerWidth,
    `Total ${title.toLowerCase()}`,
    formatAmount(total, currency),
    AMOUNT_WIDTH,
  );
}

/** Earnings on the left, deductions on the right — a payslip anybody can check by eye. */
function drawBreakdown(doc: PDFKit.PDFDocument, top: number, data: PayslipData): number {
  const { earnings, deductions } = payslipLines(data.slip, data.structure);
  const currency = data.slip.currency;
  const height = Math.max(
    columnHeight(doc, earnings, currency),
    columnHeight(doc, deductions, currency),
  );
  drawBreakdownColumn(doc, MARGIN, top, height, 'Earnings', earnings, currency);
  drawBreakdownColumn(doc, RIGHT_COLUMN, top, height, 'Deductions', deductions, currency);
  return top + height + SPACE.lg;
}

const NET_PANEL_HEIGHT = 52;

/** The net figure, set apart because it is the number the employee came for. */
function drawNet(doc: PDFKit.PDFDocument, top: number, data: PayslipData): void {
  panel(doc, MARGIN, top, CONTENT_WIDTH, NET_PANEL_HEIGHT, PANEL);
  doc
    .font(FONTS.bold)
    .fontSize(TEXT.small)
    .fillColor(ACCENT)
    .text('NET PAY', MARGIN + SPACE.md, top + SPACE.md, { characterSpacing: 0.8 });
  doc
    .font(FONTS.regular)
    .fontSize(TEXT.caption)
    .fillColor(MUTED)
    .text(
      `Gross earnings less total deductions for ${periodLabel(data.slip.month, data.slip.year)}`,
      MARGIN + SPACE.md,
      top + SPACE.md + 13,
      { width: CONTENT_WIDTH * 0.55 },
    );
  doc
    .font(FONTS.bold)
    .fontSize(TEXT.title)
    .fillColor(INK)
    .text(formatAmount(data.slip.net, data.slip.currency), MARGIN + SPACE.md, top + SPACE.md + 6, {
      width: CONTENT_WIDTH - SPACE.md * 2,
      align: 'right',
    });
}

/**
 * The foot of the page, pinned to the bottom margin rather than trailing the content, so
 * every payslip's footer lands in the same place whatever the employee's structure holds.
 *
 * The HR address is the point of it: an employee who disagrees with a figure on this page
 * needs somewhere to write, and looking that up is exactly the moment they will not.
 */
function drawFooter(doc: PDFKit.PDFDocument, data: PayslipData): void {
  const top = PAGE.height - MARGIN - 40;
  rule(doc, MARGIN, top, CONTENT_WIDTH);

  const contact = [
    `Questions about your pay? Write to ${data.company.hrEmail}`,
    data.company.supportEmail ? `Portal help: ${data.company.supportEmail}` : '',
  ]
    .filter(Boolean)
    .join('   ·   ');

  doc
    .font(FONTS.bold)
    .fontSize(TEXT.small)
    .fillColor(INK)
    .text(contact, MARGIN, top + SPACE.sm, { width: CONTENT_WIDTH, align: 'center' });
  doc
    .font(FONTS.regular)
    .fontSize(TEXT.caption)
    .fillColor(MUTED)
    .text(
      'This is a computer-generated payslip and is valid without a signature.',
      MARGIN,
      top + SPACE.sm + 13,
      { width: CONTENT_WIDTH, align: 'center' },
    );
}

/** The document properties an archive reads, which PDF/A requires to be present. */
function describe(doc: PDFKit.PDFDocument, data: PayslipData): void {
  const period = periodLabel(data.slip.month, data.slip.year);
  doc.info.Title = `Payslip — ${data.employee.name} — ${period}`;
  doc.info.Author = data.company.name;
  doc.info.Subject = `Salary statement for ${period}`;
  doc.info.Keywords = `payslip, salary, ${period}, ${data.employee.name}`;
  doc.info.Creator = 'Exyconn Track';
}

/**
 * Renders one payslip as a PDF. The same document is what the employee downloads, what
 * HR downloads and what the scheduled email attaches — one renderer, so the three can
 * never disagree about what an employee was paid.
 *
 * It is written as PDF/A-3b (ISO 19005-3, conformance level B): A4 from ISO 216, an
 * embedded font subset and an sRGB output intent, so the file renders the same in ten
 * years as it does today. That matters for a payslip specifically — it is the document
 * an employee produces years later for a loan, a visa or a tax assessment, and one
 * that renders differently then is one nobody will accept.
 */
export function buildPayslipPdf(data: PayslipData): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    subset: 'PDF/A-3b',
    pdfVersion: '1.7',
    displayTitle: true,
    lang: 'en-IN',
    info: { CreationDate: data.slip.issuedDate },
  });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  registerFonts(doc);
  describe(doc, data);

  const detailsTop = drawHeader(doc, data);
  const breakdownTop = drawDetails(doc, detailsTop, data);
  const netTop = drawBreakdown(doc, breakdownTop, data);
  drawNet(doc, netTop, data);
  drawFooter(doc, data);
  doc.end();

  return done;
}
