import { reminderSources } from './reminders.registry';
import { sendReminders } from './reminders.notify';
import { forEachOrganization } from '../organizations';
import { logger } from '../../utils/logger';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import { registerBackgroundJob } from '../tech/jobs.registry';

/**
 * How often the sweep asks. Hourly rather than daily: a daily loop in a process that
 * restarts most days would skip whole days, and asking again costs one indexed query per
 * source because anything already chased is refused by the log's unique key.
 */
const TICK_MS = 60 * 60 * 1000;

/** What one sweep did, for the log line and the tests. */
export interface SweepResult {
  /** Reminders delivered to at least one person. */
  sent: number;
  /** Sources that threw. One bad source must not silence the rest. */
  failed: number;
}

/** Runs every registered source once and delivers what they ask for. */
export async function sweepReminders(now = new Date()): Promise<SweepResult> {
  const result: SweepResult = { sent: 0, failed: 0 };
  for (const source of reminderSources()) {
    try {
      const due = await source.due(now);
      result.sent += await sendReminders(source.key, due);
    } catch (error) {
      result.failed += 1;
      logger.error(error, `Reminder source "${source.key}" failed`);
    }
  }
  return result;
}

/** Starts the hourly sweep across every company. */
export function startReminderSweep(): void {
  const tick = () => {
    const totals: SweepResult = { sent: 0, failed: 0 };
    forEachOrganization(async () => {
      const result = await sweepReminders();
      totals.sent += result.sent;
      totals.failed += result.failed;
    }, 'Reminders')
      .then(() =>
        recordJobRun(
          JOB_KEYS.reminders,
          `${totals.sent} reminder(s) sent, ${totals.failed} source(s) failed`,
        ),
      )
      .catch((error: unknown) => logger.error(error, 'Reminder sweep failed'));
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Reminder sweep started');
}

registerBackgroundJob({
  key: JOB_KEYS.reminders,
  label: 'Reminder sweep',
  description: 'Asks every module what has come due and tells whoever owns it.',
  runOnce: () => sweepReminders(),
});
