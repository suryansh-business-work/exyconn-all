import fs from 'node:fs';
import mongoose from 'mongoose';
import { healthService } from '../../../../src/modules/health';
import { PayrollScheduleModel } from '../../../../src/modules/payroll/payroll-schedule.model';
import { TrackerSettingsModel } from '../../../../src/modules/tracker/models';
import { InboundMailConfigModel } from '../../../../src/modules/tech/inbound-mail-config.model';
import { clearJobRuns, recordJobRun } from '../../../../src/utils/jobHeartbeat';

type Overview = Awaited<ReturnType<typeof healthService.overview>>;

const job = (health: Overview, key: string) => {
  const row = health.jobs.find((entry) => entry.key === key);
  if (!row) {
    throw new Error(`No job row ${key}`);
  }
  return row;
};

beforeEach(() => clearJobRuns());
afterEach(() => jest.restoreAllMocks());

describe('System Health jobs', () => {
  it('reads every switchable loop as idle, and never run, on a fresh install', async () => {
    const health = await healthService.overview();

    expect(job(health, 'payrollDispatch')).toMatchObject({
      enabled: false,
      lastRunAt: null,
      lastRunSummary: 'Never sent',
    });
    expect(job(health, 'trackerRetention').enabled).toBe(false);
    expect(job(health, 'trackerDigest')).toMatchObject({
      enabled: false,
      lastRunSummary: 'No digest sent yet',
    });
    expect(job(health, 'inboundMail').enabled).toBe(false);
    expect(job(health, 'recurringInvoices')).toMatchObject({ enabled: true, lastRunSummary: '' });
  });

  it("shows the payslip schedule's own record of its last run", async () => {
    const lastRunAt = new Date('2026-10-01T10:00:00.000Z');
    await PayrollScheduleModel.create({ enabled: true, lastRunAt, lastRunPeriod: '2026-09' });

    expect(job(await healthService.overview(), 'payrollDispatch')).toEqual({
      key: 'payrollDispatch',
      label: 'Payslip dispatch',
      enabled: true,
      lastRunAt,
      lastRunSummary: 'Last sent for 2026-09',
    });
  });

  it('falls back to the in-memory heartbeat when the schedule has never recorded a run', async () => {
    recordJobRun('payrollDispatch', 'Checked the schedule');

    const row = job(await healthService.overview(), 'payrollDispatch');

    expect(row.lastRunAt).toBeInstanceOf(Date);
    expect(row.lastRunSummary).toBe('Never sent');
  });

  it('reads the tracker loops from the tracker settings', async () => {
    await TrackerSettingsModel.create({
      screenshotRetentionDays: 30,
      dailyDigestEnabled: true,
      dailyDigestLastRun: '2026-10-06',
    });
    recordJobRun('trackerDigest', 'Sent 4 digests');

    const health = await healthService.overview();

    expect(job(health, 'trackerRetention').enabled).toBe(true);
    expect(job(health, 'trackerDigest')).toMatchObject({
      enabled: true,
      lastRunAt: expect.any(Date),
      lastRunSummary: 'Daily digest last sent 2026-10-06',
    });
  });

  it('counts the digest loop as on when only the weekly digest is switched on', async () => {
    await TrackerSettingsModel.create({ dailyDigestEnabled: false, weeklyDigestEnabled: true });

    expect(job(await healthService.overview(), 'trackerDigest').enabled).toBe(true);
  });

  it('marks inbound mail as on once a mailbox is active', async () => {
    await InboundMailConfigModel.create({
      label: 'Support',
      host: 'imap.example.com',
      user: 'support@example.com',
      password: ['generated', Date.now()].join('-'),
      isActive: true,
    });

    expect(job(await healthService.overview(), 'inboundMail').enabled).toBe(true);
  });
});

describe('System Health database and process', () => {
  it('reports no database when there is no connection to ask', async () => {
    const replaced = jest.replaceProperty(mongoose.connection, 'db', undefined);
    // mongoHealth reads the connection before its first await, so the property only has to be
    // swapped while the call starts; the counts that follow still use the real connection.
    const pending = healthService.overview();
    replaced.restore();

    expect((await pending).mongo).toEqual({
      ok: false,
      dbName: '',
      collections: 0,
      dataSizeMb: 0,
    });
  });

  it('reads missing database statistics as zero', async () => {
    const { db } = mongoose.connection;
    if (!db) {
      throw new Error('The test database is not connected');
    }
    jest.spyOn(db, 'stats').mockResolvedValue({} as never);

    expect((await healthService.overview()).mongo).toMatchObject({
      ok: true,
      collections: 0,
      dataSizeMb: 0,
    });
  });

  it('reports an empty server version when package.json names none', async () => {
    const realRead = fs.readFileSync;
    jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation(((file: fs.PathOrFileDescriptor, options?: unknown) =>
        String(file).endsWith('package.json')
          ? '{}'
          : realRead(file, options as never)) as typeof fs.readFileSync);

    expect((await healthService.overview()).serverVersion).toBe('');
  });

  it('says the backup is not configured when no status file is mounted', async () => {
    expect((await healthService.overview()).backup).toMatchObject({
      configured: false,
      ok: false,
    });
  });
});
