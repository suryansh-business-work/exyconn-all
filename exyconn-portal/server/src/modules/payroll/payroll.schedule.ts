import { AppSettingsModel } from '../admin/settings.model';
import { PayrollScheduleModel, type PayrollScheduleDocument } from './payroll-schedule.model';
import { dispatchSalarySlips } from './payroll.dispatch';
import { logger } from '../../utils/logger';

/** How often the process asks whether a scheduled dispatch is due. */
const TICK_MS = 60_000;

/** Wall-clock fields of an instant in a named timezone. */
export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/**
 * The same instant as the portal's own timezone reads it.
 *
 * HR types "the 1st at 10:00" meaning their own clock, and the server runs in UTC — so a
 * schedule compared against UTC would fire five and a half hours late in India. The
 * timezone is the one configured in Admin > Settings, not a constant.
 */
export function zonedParts(at: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(at);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0');
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
  };
}

/** `2026-08` — the key a run records so the same month is never sent twice. */
export function periodKey(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Which month a run fires for, relative to the day it fires on. */
export function targetPeriod(period: string, now: ZonedParts): { month: number; year: number } {
  if (period === 'CURRENT_MONTH') {
    return { month: now.month, year: now.year };
  }
  if (now.month === 1) {
    return { month: 12, year: now.year - 1 };
  }
  return { month: now.month - 1, year: now.year };
}

/** Fields the due check needs — the stored schedule, or anything shaped like it. */
export type ScheduleShape = Pick<
  PayrollScheduleDocument,
  'enabled' | 'dayOfMonth' | 'hour' | 'minute' | 'period' | 'lastRunPeriod'
>;

/**
 * Whether a schedule should fire now.
 *
 * Due means "on or after the chosen minute of the chosen day, and this period has not been
 * sent yet" rather than an exact minute match, so a restart or a busy tick during the
 * scheduled minute still sends — and `lastRunPeriod` still stops a second send.
 */
export function isDue(schedule: ScheduleShape, now: ZonedParts): boolean {
  if (!schedule.enabled || now.day !== schedule.dayOfMonth) {
    return false;
  }
  const dueMinute = schedule.hour * 60 + schedule.minute;
  if (now.hour * 60 + now.minute < dueMinute) {
    return false;
  }
  const target = targetPeriod(schedule.period, now);
  return schedule.lastRunPeriod !== periodKey(target.month, target.year);
}

/** The schedule document, created with its defaults the first time it is read. */
export async function readSchedule(): Promise<PayrollScheduleDocument> {
  return PayrollScheduleModel.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global' } },
    { new: true, upsert: true },
  ).lean();
}

/** Sends the due period and records what happened, so the next tick knows to stand down. */
async function runIfDue(): Promise<void> {
  const [schedule, settings] = await Promise.all([
    readSchedule(),
    AppSettingsModel.findOne().lean(),
  ]);
  const now = zonedParts(new Date(), settings?.timezone ?? 'UTC');
  if (!isDue(schedule, now)) {
    return;
  }
  const target = targetPeriod(schedule.period, now);
  const result = await dispatchSalarySlips(target.month, target.year, 'payroll schedule');
  await PayrollScheduleModel.updateOne(
    { key: 'global' },
    {
      lastRunAt: new Date(),
      lastRunPeriod: periodKey(target.month, target.year),
      lastSent: result.sent,
      lastFailed: result.failed,
      lastSkipped: result.skipped,
    },
  );
}

/** Starts the once-a-minute check that emails payslips on HR's schedule. */
export function startPayrollDispatch(): void {
  const tick = () => {
    runIfDue().catch((error: unknown) => logger.error(error, 'Payslip dispatch check failed'));
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Payslip dispatch scheduler started');
}
