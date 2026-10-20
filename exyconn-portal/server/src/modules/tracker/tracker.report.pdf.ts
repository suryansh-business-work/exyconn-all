import PDFDocument from 'pdfkit';
import { drawLogo, logoHeight, registerFonts, FONTS } from '../payroll/payslip.brand';
import {
  CONTENT_WIDTH,
  INK,
  MARGIN,
  MUTED,
  PAGE,
  PANEL,
  RULE,
  TEXT,
  rule,
} from '../payroll/payslip.layout';
import { formatAmount } from '../../utils/money';
import type { HoursReport, ReportDay, ReportDayStatus } from './tracker.report.data';

/**
 * The status words and printed colours — the light-mode hues of the trackers' shared
 * `trackerDayStatus` tokens (packages/ui tracker.token.ts), since a PDF is read on white.
 */
const STATUS: Readonly<Record<ReportDayStatus, { word: string; color: string }>> = {
  COMPLETED: { word: 'Completed', color: '#067647' },
  SHORT: { word: 'Short', color: '#b42318' },
  LEAVE: { word: 'Leave', color: '#2563b8' },
  HOLIDAY: { word: 'Holiday', color: '#7c3aed' },
  WEEK_OFF: { word: 'Week off', color: '#5c6672' },
  OFF_COMPUTER: { word: 'Off Computer Work', color: '#b54708' },
  NONE: { word: '—', color: '#94a3b8' },
};

const COLUMNS = [
  { title: 'Date', width: 70 },
  { title: 'Status', width: 96 },
  { title: 'Expected', width: 55 },
  { title: 'Active', width: 55 },
  { title: 'Off computer', width: 58 },
  { title: 'Worked', width: 55 },
  { title: 'Idle', width: 52 },
  { title: 'Activity', width: CONTENT_WIDTH - 441 },
] as const;

const ROW = 16;
const BOTTOM = PAGE.height - MARGIN - 24;

/** "7h 18m", "-2h 5m", "0m". */
export function formatHm(ms: number): string {
  const minutes = Math.round(Math.abs(ms) / 60_000);
  const text = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
  return ms < 0 && minutes > 0 ? `-${text}` : text;
}

/** A `YYYY-MM-DD` key as the reader writes a date ("Tue 6 Oct"). */
function dayLabel(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function periodLabel(report: HoursReport, locale: string): string {
  const first = report.days[0]?.date;
  const last = report.days.at(-1)?.date;
  if (!first || !last) {
    return '';
  }
  const long = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
  return first === last ? long(first) : `${long(first)} – ${long(last)}`;
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  report: HoursReport,
  locale: string,
  company: string,
): number {
  drawLogo(doc, MARGIN, MARGIN, 96);
  doc
    .font(FONTS.bold)
    .fontSize(TEXT.title)
    .fillColor(INK)
    .text('Hours report', MARGIN, MARGIN + logoHeight(96) + 10);
  doc.font(FONTS.regular).fontSize(TEXT.body).fillColor(MUTED);
  doc.text(`${report.employee.name}  ·  ${report.employee.email}`);
  doc.text(`${periodLabel(report, locale)}  ·  ${company}  ·  ${report.timezone}`);
  const bottom = doc.y + 10;
  rule(doc, MARGIN, bottom, CONTENT_WIDTH);
  return bottom + 12;
}

/** The headline figures, four to a row. */
function drawSummary(
  doc: PDFKit.PDFDocument,
  top: number,
  report: HoursReport,
  locale: string,
): number {
  const { totals, earnings } = report;
  const earned =
    earnings.amount === null
      ? 'Salaried'
      : formatAmount(earnings.amount, earnings.currency, locale);
  const figures: Array<[string, string]> = [
    ['Expected', formatHm(totals.expectedMs)],
    ['Logged', formatHm(totals.workedMs)],
    ['Active', formatHm(totals.activeMs)],
    ['Off Computer Work', formatHm(totals.offComputerMs)],
    ['Idle (not worked)', formatHm(totals.idleMs)],
    ['Deficit so far', formatHm(totals.deficitMs)],
    ['Leave', `${totals.leaveDays} days (-${formatHm(totals.leaveMs)})`],
    ['Earnings', earned],
  ];
  const width = (CONTENT_WIDTH - 3 * 8) / 4;
  const height = 40;
  figures.forEach(([label, value], index) => {
    const left = MARGIN + (index % 4) * (width + 8);
    const y = top + Math.floor(index / 4) * (height + 8);
    doc.roundedRect(left, y, width, height, 4).fill(PANEL);
    doc
      .font(FONTS.regular)
      .fontSize(TEXT.caption)
      .fillColor(MUTED)
      .text(label, left + 8, y + 7, { width: width - 16 });
    doc
      .font(FONTS.bold)
      .fontSize(TEXT.heading)
      .fillColor(INK)
      .text(value, left + 8, y + 19, { width: width - 16 });
  });
  return top + 2 * (height + 8) + 6;
}

function drawTableHeader(doc: PDFKit.PDFDocument, top: number): number {
  let left = MARGIN;
  doc.font(FONTS.bold).fontSize(TEXT.small).fillColor(MUTED);
  for (const column of COLUMNS) {
    doc.text(column.title, left, top, { width: column.width - 4 });
    left += column.width;
  }
  rule(doc, MARGIN, top + ROW - 3, CONTENT_WIDTH, RULE);
  return top + ROW;
}

function cellsOf(day: ReportDay, locale: string): string[] {
  const status = STATUS[day.status];
  return [
    dayLabel(day.date, locale),
    day.label ? `${status.word} (${day.label})` : status.word,
    formatHm(day.expectedMs),
    formatHm(day.activeMs),
    formatHm(day.offComputerMs),
    formatHm(day.workedMs),
    formatHm(day.idleMs),
    day.activeMs + day.idleMs > 0 ? `${day.activityPercent}%` : '—',
  ];
}

function drawDay(doc: PDFKit.PDFDocument, top: number, day: ReportDay, locale: string): void {
  let left = MARGIN;
  cellsOf(day, locale).forEach((text, index) => {
    const column = COLUMNS[index];
    if (index === 1) {
      doc.circle(left + 3, top + 4, 2.6).fill(STATUS[day.status].color);
      doc
        .font(FONTS.regular)
        .fontSize(TEXT.small)
        .fillColor(INK)
        .text(text, left + 9, top, { width: column.width - 12, lineBreak: false, ellipsis: true });
    } else {
      doc
        .font(FONTS.regular)
        .fontSize(TEXT.small)
        .fillColor(INK)
        .text(text, left, top, { width: column.width - 4, lineBreak: false });
    }
    left += column.width;
  });
}

/** One page after another of day rows, the column titles repeated on each. */
function drawDays(
  doc: PDFKit.PDFDocument,
  top: number,
  report: HoursReport,
  locale: string,
): number {
  let y = drawTableHeader(doc, top);
  for (const day of report.days) {
    if (y + ROW > BOTTOM) {
      doc.addPage();
      y = drawTableHeader(doc, MARGIN);
    }
    drawDay(doc, y, day, locale);
    y += ROW;
  }
  return y;
}

function drawNotes(doc: PDFKit.PDFDocument, top: number, report: HoursReport): void {
  const y = top + 10 > BOTTOM ? (doc.addPage(), MARGIN) : top + 10;
  doc
    .font(FONTS.regular)
    .fontSize(TEXT.caption)
    .fillColor(MUTED)
    .text(
      'Logged hours are active tracked time plus approved Off Computer Work. Idle time — the tracker running with no activity — is never counted as worked time. ' +
        `The deficit compares logged hours with the expected hours of the days already over. Work on a week off: ${formatHm(report.totals.weekOffWorkedMs)}.`,
      MARGIN,
      y,
      { width: CONTENT_WIDTH },
    );
}

/** The hours report as an A4 PDF, with the company's typefaces and logo. */
export function buildHoursReportPdf(
  report: HoursReport,
  options: { locale: string; company: string },
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    displayTitle: true,
    lang: options.locale,
  });
  doc.info.Title = `Hours report — ${report.employee.name}`;
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  registerFonts(doc);
  const summaryTop = drawHeader(doc, report, options.locale, options.company);
  const tableTop = drawSummary(doc, summaryTop, report, options.locale);
  const end = drawDays(doc, tableTop, report, options.locale);
  drawNotes(doc, end, report);
  doc.end();
  return done;
}
