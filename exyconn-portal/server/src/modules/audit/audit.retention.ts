import { AuditLogModel } from './audit.model';
import { AppSettingsModel } from '../admin/settings.model';
import { registerBackgroundJob } from '../tech/jobs.registry';
import { forEachOrganization } from '../organizations';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import { logger } from '../../utils/logger';

/** How often the process asks whether any audit history has aged out. */
const TICK_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

/**
 * How many rows one pass removes.
 *
 * An install that switches retention on for the first time may have years behind it, and
 * deleting all of it in one statement would hold a write lock for as long as that takes.
 * Retention is a policy about days, so it does not have to complete in one minute.
 */
const BATCH = 2000;

/**
 * Deletes audit history past the window the workspace chose.
 *
 * Nothing happens unless somebody has set a window: zero days means keep for ever, which is
 * the default, because an audit trail is what an incident is reconstructed from and several
 * standards ask for a stated period. What this prevents is the other failure — a collection
 * that grows for ever because nobody ever decided it should.
 */
export async function purgeAgedAuditLog(now = new Date()): Promise<number> {
  const settings = await AppSettingsModel.findOne().select('auditRetentionDays').lean();
  const days = settings?.auditRetentionDays ?? 0;
  if (days <= 0) {
    return 0;
  }
  const cutoff = new Date(now.getTime() - days * DAY_MS);
  const aged = await AuditLogModel.find({ createdAt: { $lt: cutoff } })
    .select('_id')
    .limit(BATCH)
    .lean();
  if (aged.length === 0) {
    return 0;
  }
  const result = await AuditLogModel.deleteMany({ _id: { $in: aged.map((row) => row._id) } });
  logger.info({ deleted: result.deletedCount, retentionDays: days }, 'Audit retention pass');
  return result.deletedCount;
}

/** One pass, with its heartbeat — what both the timer and the Run now button call. */
async function runPass(): Promise<void> {
  const deleted = await purgeAgedAuditLog();
  recordJobRun(JOB_KEYS.auditRetention, deleted > 0 ? `Deleted ${deleted}` : 'Nothing aged out');
}

registerBackgroundJob({
  key: JOB_KEYS.auditRetention,
  label: 'Audit retention',
  description: 'Deletes audit history past the window set in Admin › Settings. Off by default.',
  runOnce: runPass,
});

/** Starts the four-hourly check across every company. */
export function startAuditRetention(): void {
  const tick = () => {
    forEachOrganization(runPass, 'Audit retention').catch((error: unknown) =>
      logger.error(error, 'Audit retention pass failed'),
    );
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Audit retention started');
}
