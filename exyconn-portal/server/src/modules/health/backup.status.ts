import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { logger } from '../../utils/logger';

/**
 * What the nightly backup left behind, read from the file `deploy/backup-mongo.sh` writes.
 *
 * A file rather than a database row, deliberately: a backup's whole job is to survive the
 * database, so its own record must not live inside the thing it is insuring. The API reads
 * it from a read-only mount, which also means the API cannot pretend a backup happened.
 */
const statusSchema = z.object({
  ok: z.boolean(),
  startedAt: z.string(),
  finishedAt: z.string(),
  archive: z.string(),
  bytes: z.number(),
  seconds: z.number(),
  retainDays: z.number(),
  message: z.string(),
});

export interface BackupStatus {
  /** False when no status file is mounted at all — nobody has installed the timer. */
  configured: boolean;
  /** Whether the last run succeeded. False when there has never been one. */
  ok: boolean;
  lastRunAt: Date | null;
  archive: string;
  sizeMb: number;
  retainDays: number;
  message: string;
}

const BYTES_PER_MB = 1024 * 1024;
const NOT_CONFIGURED: BackupStatus = {
  configured: false,
  ok: false,
  lastRunAt: null,
  archive: '',
  sizeMb: 0,
  retainDays: 0,
  message: 'No backup status file is mounted. Run deploy/install-backups.sh on the host.',
};

/**
 * Reads the status file, if there is one.
 *
 * Read on every query rather than cached: the point of the card is to say when the backup
 * last ran, and a value cached at boot would freeze that answer at whatever it was the day
 * the API last restarted.
 */
export function readBackupStatus(path: string): BackupStatus {
  if (!path) {
    return NOT_CONFIGURED;
  }
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return NOT_CONFIGURED;
  }
  const parsed = statusSchema.safeParse(JSON.parse(raw) as unknown);
  if (!parsed.success) {
    logger.error({ path }, 'Backup status file could not be read');
    return { ...NOT_CONFIGURED, configured: true, message: 'The status file is unreadable.' };
  }
  const status = parsed.data;
  return {
    configured: true,
    ok: status.ok,
    lastRunAt: new Date(status.finishedAt),
    archive: status.archive,
    sizeMb: Number((status.bytes / BYTES_PER_MB).toFixed(1)),
    retainDays: status.retainDays,
    message: status.message,
  };
}
