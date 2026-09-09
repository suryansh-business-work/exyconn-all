import { readFileSync } from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { UserModel } from '../admin/user.model';
import { SupportTicketModel } from '../employee/support.model';
import { InvoiceModel } from '../finance/finance.model';
import { PayrollScheduleModel } from '../payroll/payroll-schedule.model';
import { TrackerSettingsModel } from '../tracker/models';
import { env } from '../../config/env';
import { readJobRuns, type JobRun } from '../../utils/jobHeartbeat';

/**
 * The server's own package.json. Three directories up from this file in both layouts:
 * `src/modules/health` when running from source and `dist/modules/health` once built.
 */
const PACKAGE_JSON_PATH = path.join(__dirname, '..', '..', '..', 'package.json');

const BYTES_PER_MB = 1024 * 1024;
/** Two decimals is the resolution the card renders; more is noise. */
const MB_DECIMALS = 2;

interface HealthMongo {
  ok: boolean;
  dbName: string;
  collections: number;
  dataSizeMb: number;
}

interface HealthJob {
  key: string;
  label: string;
  enabled: boolean;
  lastRunAt: Date | null;
  lastRunSummary: string;
}

/** Mongoose's ready state for "connected". */
const CONNECTED = 1;

function serverVersion(): string {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as { version?: string };
  return pkg.version ?? '';
}

/** The database's own view of itself, or `ok: false` when there is no connection to ask. */
async function mongoHealth(): Promise<HealthMongo> {
  const { db } = mongoose.connection;
  if (mongoose.connection.readyState !== CONNECTED || !db) {
    return { ok: false, dbName: '', collections: 0, dataSizeMb: 0 };
  }
  const stats = await db.stats();
  return {
    ok: true,
    dbName: db.databaseName,
    collections: Number(stats.collections ?? 0),
    dataSizeMb: Number((Number(stats.dataSize ?? 0) / BYTES_PER_MB).toFixed(MB_DECIMALS)),
  };
}

/** One job row, folded from the in-memory tick and whatever the service persisted. */
function jobRow(
  key: string,
  label: string,
  enabled: boolean,
  runs: Map<string, JobRun>,
  persisted?: { at: Date | null; summary: string },
): HealthJob {
  const tick = runs.get(key);
  return {
    key,
    label,
    enabled,
    lastRunAt: persisted?.at ?? tick?.at ?? null,
    lastRunSummary: persisted?.summary ?? tick?.summary ?? '',
  };
}

/**
 * The four loops `server.ts` starts. `enabled` reads each loop's own switch, so a
 * schedule an administrator turned off reads as idle rather than broken.
 */
async function jobs(): Promise<HealthJob[]> {
  const runs = readJobRuns();
  const [schedule, tracker] = await Promise.all([
    PayrollScheduleModel.findOne({ key: 'global' }).lean(),
    TrackerSettingsModel.findOne({ key: 'global' }).lean(),
  ]);
  const digestEnabled = Boolean(tracker?.dailyDigestEnabled ?? tracker?.weeklyDigestEnabled);
  const digestLastRun = tracker?.dailyDigestLastRun ?? '';
  return [
    jobRow('statusMonitor', 'Status page monitor', env.status.enabled, runs),
    jobRow('payrollDispatch', 'Payslip dispatch', Boolean(schedule?.enabled), runs, {
      at: schedule?.lastRunAt ?? null,
      summary: schedule?.lastRunPeriod ? `Last sent for ${schedule.lastRunPeriod}` : 'Never sent',
    }),
    jobRow(
      'trackerRetention',
      'Screenshot retention',
      (tracker?.screenshotRetentionDays ?? 0) > 0,
      runs,
    ),
    jobRow('trackerDigest', 'Tracker digests', digestEnabled, runs, {
      at: runs.get('trackerDigest')?.at ?? null,
      summary: digestLastRun ? `Daily digest last sent ${digestLastRun}` : 'No digest sent yet',
    }),
    // Always "enabled": the loop runs whether or not anybody has set a retainer up, and a
    // dead loop is exactly what this screen exists to show.
    jobRow('recurringInvoices', 'Recurring invoices', true, runs),
    jobRow('webhookDelivery', 'Webhook delivery', true, runs),
  ];
}

/** Headline numbers, each one `countDocuments` on an indexed field. */
async function counts(): Promise<{ label: string; value: number }[]> {
  const [users, activeUsers, openTickets, unpaidInvoices] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ isActive: true }),
    SupportTicketModel.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
    InvoiceModel.countDocuments({ status: { $ne: 'PAID' } }),
  ]);
  return [
    { label: 'Users', value: users },
    { label: 'Active users', value: activeUsers },
    { label: 'Open support tickets', value: openTickets },
    { label: 'Unpaid invoices', value: unpaidInvoices },
  ];
}

export const healthService = {
  overview: async () => ({
    serverVersion: serverVersion(),
    nodeVersion: process.version,
    uptimeSeconds: Math.round(process.uptime()),
    mongo: await mongoHealth(),
    jobs: await jobs(),
    counts: await counts(),
  }),
};
