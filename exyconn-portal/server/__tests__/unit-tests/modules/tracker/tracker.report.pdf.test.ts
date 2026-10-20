import PDFDocument from 'pdfkit';
import { MARGIN } from '../../../../src/modules/payroll/payslip.layout';
import { buildHoursReportPdf, formatHm } from '../../../../src/modules/tracker/tracker.report.pdf';
import type {
  HoursReport,
  ReportDay,
  ReportDayStatus,
} from '../../../../src/modules/tracker/tracker.report.data';

const HOUR = 3_600_000;
const MINUTE = 60_000;
const OPTIONS = { locale: 'en-GB', company: 'Test Co' };

const day = (
  date: string,
  status: ReportDayStatus,
  fields: Partial<ReportDay> = {},
): ReportDay => ({
  date,
  status,
  label: '',
  expectedMs: 8 * HOUR,
  activeMs: 6 * HOUR,
  idleMs: 2 * HOUR,
  offComputerMs: HOUR,
  workedMs: 7 * HOUR,
  activityPercent: 75,
  ...fields,
});

/** A report of `count` consecutive days from 1 January 2026. */
function reportOf(count: number, earnings: Partial<HoursReport['earnings']> = {}): HoursReport {
  const days = Array.from({ length: count }, (_unused, index) =>
    day(new Date(Date.UTC(2026, 0, 1 + index)).toISOString().slice(0, 10), 'SHORT'),
  );
  return {
    employee: { id: 'u1', name: 'Asha Rao', email: 'asha@exyconn.com' },
    from: '2026-01-01T00:00:00.000Z',
    to: '2026-01-02T00:00:00.000Z',
    timezone: 'Asia/Kolkata',
    workHoursPerDay: 8,
    days,
    totals: {
      expectedMs: 8 * HOUR,
      expectedSoFarMs: 8 * HOUR,
      workedMs: 7 * HOUR,
      activeMs: 6 * HOUR,
      idleMs: 2 * HOUR,
      offComputerMs: HOUR,
      weekOffWorkedMs: 90 * MINUTE,
      deficitMs: -HOUR,
      leaveDays: 2,
      leaveMs: 16 * HOUR,
    },
    earnings: { payType: 'FIXED', rate: 0, currency: 'USD', amount: null, ...earnings },
  };
}

/** Pages in a finished PDF: every page object, never the page tree. */
const pagesIn = (pdf: Buffer) => pdf.toString('latin1').match(/\/Type \/Page\b(?!s)/g)?.length;

/** Every string the PDF draws, read off the document as it is written. */
function drawnText() {
  const text = jest.spyOn(PDFDocument.prototype, 'text');
  const read = () => text.mock.calls.map(([value]) => String(value));
  return Object.assign(read, { calls: () => text.mock.calls, clear: () => text.mockClear() });
}

afterEach(() => jest.restoreAllMocks());

describe('formatHm', () => {
  it.each([
    [0, '0m'],
    [59 * MINUTE, '59m'],
    [60 * MINUTE, '1h 0m'],
    [7 * HOUR + 18 * MINUTE, '7h 18m'],
    [-(2 * HOUR + 5 * MINUTE), '-2h 5m'],
    [-20_000, '0m'],
    [29_999, '0m'],
    [30_000, '1m'],
  ])('writes %i ms as "%s"', (ms, text) => {
    expect(formatHm(ms)).toBe(text);
  });
});

describe('buildHoursReportPdf', () => {
  it('writes a one-page PDF for a short range', async () => {
    const pdf = await buildHoursReportPdf(reportOf(7), OPTIONS);

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pagesIn(pdf)).toBe(1);
  });

  it('carries a long range over more pages, repeating the column titles', async () => {
    const read = drawnText();

    const pdf = await buildHoursReportPdf(reportOf(62), OPTIONS);

    const pages = pagesIn(pdf) ?? 0;
    expect(pages).toBeGreaterThan(1);
    expect(read().filter((text) => text === 'Date')).toHaveLength(pages);
  });

  it('labels the employee, the period, the company and every status', async () => {
    const read = drawnText();
    const report = reportOf(0);
    report.days = [
      day('2026-01-05', 'COMPLETED'),
      day('2026-01-06', 'HOLIDAY', { label: 'Founders Day', expectedMs: 0 }),
      day('2026-01-07', 'SHORT'),
      day('2026-01-08', 'LEAVE', { label: 'CL' }),
      day('2026-01-09', 'OFF_COMPUTER'),
      day('2026-01-10', 'WEEK_OFF'),
      day('2026-01-11', 'NONE', { activeMs: 0, idleMs: 0 }),
    ];

    await buildHoursReportPdf(report, OPTIONS);

    const texts = read();
    expect(texts).toEqual(
      expect.arrayContaining([
        'Hours report',
        'Asha Rao  ·  asha@exyconn.com',
        '5 January 2026 – 11 January 2026  ·  Test Co  ·  Asia/Kolkata',
        'Mon 5 Jan',
        'Completed',
        'Holiday (Founders Day)',
        'Short',
        'Leave (CL)',
        'Off Computer Work',
        'Week off',
        '75%',
        'Deficit so far',
        '-1h 0m',
        '2 days (-16h 0m)',
        'Salaried',
      ]),
    );
    // A day nothing was tracked on has no activity share to show.
    expect(texts.filter((text) => text === '—')).toHaveLength(2);
    expect(texts.some((text) => text.includes('Work on a week off: 1h 30m.'))).toBe(true);
  });

  it('names a single day on its own rather than as a range', async () => {
    const read = drawnText();

    await buildHoursReportPdf(reportOf(1), OPTIONS);

    expect(read()).toContain('1 January 2026  ·  Test Co  ·  Asia/Kolkata');
  });

  it('leaves the period blank for a report with no days', async () => {
    const read = drawnText();

    const pdf = await buildHoursReportPdf(reportOf(0), OPTIONS);

    expect(pagesIn(pdf)).toBe(1);
    expect(read()).toContain('  ·  Test Co  ·  Asia/Kolkata');
  });

  it('prices hourly pay in the report’s currency', async () => {
    const read = drawnText();

    await buildHoursReportPdf(
      reportOf(1, { payType: 'HOURLY', rate: 10, currency: 'USD', amount: 70 }),
      OPTIONS,
    );

    expect(read()).toContain('US$70.00');
    expect(read()).not.toContain('Salaried');
  });

  it('starts the notes on a new page when the table fills the last one', async () => {
    const read = drawnText();
    const notesAt = () =>
      read.calls().find(([value]) => String(value).startsWith('Logged hours are'))?.[2];

    // Thirty days leave room under the table; a 31-day month fills the page to its foot.
    expect(pagesIn(await buildHoursReportPdf(reportOf(30), OPTIONS))).toBe(1);
    expect(notesAt()).toBeGreaterThan(MARGIN);
    read.clear();
    expect(pagesIn(await buildHoursReportPdf(reportOf(31), OPTIONS))).toBe(2);
    expect(notesAt()).toBe(MARGIN);
  });
});
