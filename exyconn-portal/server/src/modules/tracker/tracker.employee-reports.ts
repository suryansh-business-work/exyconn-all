import { addDays } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { companyProfile } from '../../lib/company';
import { logger } from '../../utils/logger';
import { formatAmount } from '../../utils/money';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import { emailer, rawHtml } from '../email';
import { escapeHtml } from '../email/email.render';
import { forEachOrganization } from '../organizations/organization.each';
import { claimReminder } from '../reminders/reminders.notify';
import { ReminderLogModel } from '../reminders/reminder-log.model';
import { registerBackgroundJob } from '../tech/jobs.registry';
import { TrackerAccessModel } from './models';
import { buildHoursReport, type HoursReport, type ReportDayStatus } from './tracker.report.data';
import { reportBranding } from './tracker.report.file';
import { buildHoursReportPdf, formatHm } from './tracker.report.pdf';
import { getTrackerSettings, type TrackerSettingsLean } from './tracker.settings.service';
import { isValidTimezone, zonedDateKey, zonedHour } from './tracker.timezone';
import { inSequence } from '../../utils/inSequence';

/** Checked every five minutes: an evening report lands within minutes of its hour. */
const TICK_MS = 5 * 60_000;
const SOURCE = 'tracker-employee-reports';

export type ReportPeriod = 'DAY' | 'WEEK' | 'MONTH';

const STATUS_WORDS: Readonly<Record<ReportDayStatus, string>> = {
  COMPLETED: 'Completed',
  SHORT: 'Short',
  LEAVE: 'Leave',
  HOLIDAY: 'Holiday',
  WEEK_OFF: 'Week off',
  OFF_COMPUTER: 'Off Computer Work',
  NONE: '—',
};

/** The employee's zone: their own pick, else the house default, else the company's. */
export function zoneOf(own: string | null | undefined, house: string, company: string): string {
  return [own, house, company].find((zone) => zone && isValidTimezone(zone)) ?? 'UTC';
}

/** Local midnight of a `YYYY-MM-DD` key in `zone`, as an instant. */
const startOf = (dateKey: string, zone: string) => fromZonedTime(`${dateKey}T00:00:00`, zone);
const keyPlus = (dateKey: string, days: number) =>
  addDays(new Date(`${dateKey}T12:00:00Z`), days)
    .toISOString()
    .slice(0, 10);

/** The periods due today: the day always, the week on Sunday, the month on its last day. */
export function periodsDue(todayKey: string, settings: TrackerSettingsLean): ReportPeriod[] {
  const due: ReportPeriod[] = [];
  if (settings.employeeDailyReportEnabled) due.push('DAY');
  const isSunday = new Date(`${todayKey}T12:00:00Z`).getUTCDay() === 0;
  if (settings.employeeWeeklyReportEnabled && isSunday) due.push('WEEK');
  const isMonthEnd = keyPlus(todayKey, 1).slice(0, 7) !== todayKey.slice(0, 7);
  if (settings.employeeMonthlyReportEnabled && isMonthEnd) due.push('MONTH');
  return due;
}

/** The first and last day (inclusive) a period ending today covers. */
export function periodDays(
  period: ReportPeriod,
  todayKey: string,
): { first: string; last: string } {
  if (period === 'WEEK') return { first: keyPlus(todayKey, -6), last: todayKey };
  if (period === 'MONTH') return { first: `${todayKey.slice(0, 7)}-01`, last: todayKey };
  return { first: todayKey, last: todayKey };
}

function periodLabel(period: ReportPeriod, first: string, last: string, locale: string): string {
  const read = (key: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(
      new Date(`${key}T12:00:00Z`),
    );
  if (period === 'MONTH') return `for ${read(first, { month: 'long', year: 'numeric' })}`;
  if (period === 'WEEK') {
    return `for ${read(first, { day: 'numeric', month: 'short' })} – ${read(last, { day: 'numeric', month: 'short' })}`;
  }
  return `on ${read(first, { weekday: 'long', day: 'numeric', month: 'long' })}`;
}

/** The day table of a week or month, already escaped; the day's report has none. */
function dayRows(report: HoursReport, period: ReportPeriod): string {
  if (period === 'DAY') return '';
  return report.days
    .map((day) => {
      const status = escapeHtml(
        day.label ? `${STATUS_WORDS[day.status]} (${day.label})` : STATUS_WORDS[day.status],
      );
      return `<tr><td style="padding:3px 0;">${escapeHtml(day.date)}</td><td style="padding:3px 0;">${status}</td><td style="padding:3px 0;text-align:right;">${escapeHtml(formatHm(day.workedMs))}</td></tr>`;
    })
    .join('');
}

/** A day nobody owed and nobody worked is not worth an email. */
const isEmptyDay = (report: HoursReport) =>
  report.totals.expectedMs === 0 && report.totals.workedMs === 0;

/** Renders and sends one report; the caller holds its once-a-day claim. */
async function deliver(report: HoursReport, period: ReportPeriod, first: string, last: string) {
  const branding = await reportBranding();
  const { totals, earnings } = report;
  const attachments =
    period === 'DAY'
      ? undefined
      : [
          {
            filename: `hours-${first}-to-${last}.pdf`,
            content: await buildHoursReportPdf(report, branding),
          },
        ];
  await emailer.send({
    template: 'tracker-hours-report',
    to: report.employee.email,
    triggeredBy: 'tracker employee report schedule',
    attachments,
    variables: {
      name: report.employee.name,
      periodLabel: periodLabel(period, first, last, branding.locale),
      expected: formatHm(totals.expectedMs),
      logged: formatHm(totals.workedMs),
      active: formatHm(totals.activeMs),
      offComputer: formatHm(totals.offComputerMs),
      idle: formatHm(totals.idleMs),
      deficit: formatHm(totals.deficitMs),
      earnings:
        earnings.amount === null
          ? 'Salaried'
          : formatAmount(earnings.amount, earnings.currency, branding.locale),
      rows: rawHtml(dayRows(report, period)),
    },
  });
}

/** Builds and sends one employee's report for one period, unless it already went out. */
export async function sendEmployeeReport(
  userId: string,
  period: ReportPeriod,
  todayKey: string,
  zone: string,
) {
  const { first, last } = periodDays(period, todayKey);
  const end = startOf(keyPlus(last, 1), zone);
  // Read as of the period's end: the evening's report closes the day, so today's shortfall
  // counts rather than the day reading as still in progress (deficit = logged).
  const report = await buildHoursReport(userId, startOf(first, zone), end, zone, end);
  if (!report.employee.email || (period === 'DAY' && isEmptyDay(report))) {
    return false;
  }
  const dedupeKey = `${SOURCE}:${period}:${userId}:${todayKey}`;
  if (!(await claimReminder(SOURCE, dedupeKey, 1))) {
    return false;
  }
  try {
    await deliver(report, period, first, last);
  } catch (error) {
    // Give the claim back, so the next tick retries rather than the report never going out.
    await ReminderLogModel.deleteOne({ dedupeKey });
    throw error;
  }
  return true;
}

/**
 * Sends every tracked employee whatever is due at their evening hour, in their own zone: the
 * day, the week on Sunday and the month on its last day. Each goes out once, whatever the
 * restarts — the reminder log holds a key per employee, period and day.
 */
export async function runEmployeeReports(now: Date = new Date()): Promise<number> {
  const settings = await getTrackerSettings();
  const company = await companyProfile();
  const accesses = await TrackerAccessModel.find({ isActive: true })
    .select('userId timezone')
    .lean();
  // Every report due now, across people and periods. Sent one at a time so a large company
  // does not open hundreds of mail connections at once.
  const due = accesses.flatMap((access) => {
    const zone = zoneOf(access.timezone, settings.defaultTimezone, company.timezone);
    if (zonedHour(now, zone) < settings.employeeReportHour) {
      return [];
    }
    const todayKey = zonedDateKey(now, zone);
    return periodsDue(todayKey, settings).map((period) => ({ access, period, todayKey, zone }));
  });
  const outcomes = await inSequence(due, async ({ access, period, todayKey, zone }) => {
    try {
      return await sendEmployeeReport(access.userId, period, todayKey, zone);
    } catch (error) {
      logger.error({ err: error, userId: access.userId, period }, 'Tracker employee report failed');
      return false;
    }
  });
  const sent = outcomes.filter(Boolean).length;
  recordJobRun(JOB_KEYS.trackerEmployeeReports, `Sent ${sent} employee reports`);
  return sent;
}

export function startEmployeeReports(): void {
  const tick = () => {
    forEachOrganization(() => runEmployeeReports(), 'Tracker employee reports').catch(
      (error: unknown) => logger.error(error, 'Tracker employee reports check failed'),
    );
  };
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Tracker employee reports scheduler started');
}

registerBackgroundJob({
  key: JOB_KEYS.trackerEmployeeReports,
  label: 'Tracker employee reports',
  description:
    'Emails each tracked employee their own day every evening, their week on Sunday and their month on its last day (with the PDF).',
  runOnce: () => runEmployeeReports(),
});
