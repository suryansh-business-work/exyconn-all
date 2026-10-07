import { Types } from 'mongoose';
import { startAuditRetention } from '../../src/modules/audit/audit.retention';
import { AuditLogModel } from '../../src/modules/audit/audit.model';
import { AppSettingsModel } from '../../src/modules/admin/settings.model';
import { OrganizationModel } from '../../src/modules/organizations/organization.model';
import { findBackgroundJob } from '../../src/modules/tech/jobs.registry';
import { JOB_KEYS, clearJobRuns, readJobRuns } from '../../src/utils/jobHeartbeat';
import { logger } from '../../src/utils/logger';
import { useTestOrganization } from '../helpers';

const DAY = 86_400_000;
const SIX_HOURS = 6 * 60 * 60 * 1000;

/** Waits, on real timers, until `check` holds — the retention tick runs detached. */
async function eventually(check: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 250; attempt += 1) {
    if (check()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('The condition never held');
}

const lastSummary = () => readJobRuns().get(JOB_KEYS.auditRetention)?.summary;

describe('the audit retention job', () => {
  const organizationId = useTestOrganization();

  /** Mongoose stamps `createdAt` itself, so an aged row is written straight to the collection. */
  const agedEntry = (daysAgo: number) =>
    AuditLogModel.collection.insertOne({
      organizationId: new Types.ObjectId(organizationId),
      actorId: 'u1',
      action: 'UPDATE',
      module: 'Invoice',
      summary: 'Changed the amount',
      createdAt: new Date(Date.now() - daysAgo * DAY),
    });

  beforeEach(() => clearJobRuns());
  afterEach(() => jest.restoreAllMocks());

  it('registers a Run now pass that reports what it deleted', async () => {
    await agedEntry(40);
    await agedEntry(1);
    await AppSettingsModel.updateOne(
      { key: 'global' },
      { auditRetentionDays: 30 },
      { upsert: true },
    );

    await findBackgroundJob(JOB_KEYS.auditRetention)?.runOnce();

    expect(lastSummary()).toBe('Deleted 1');
    expect(await AuditLogModel.countDocuments()).toBe(1);
  });

  it('reports a pass that found nothing to delete', async () => {
    await agedEntry(1);

    await findBackgroundJob(JOB_KEYS.auditRetention)?.runOnce();

    expect(lastSummary()).toBe('Nothing aged out');
    expect(await AuditLogModel.countDocuments()).toBe(1);
  });

  it('describes itself for the Tech jobs screen', () => {
    expect(findBackgroundJob(JOB_KEYS.auditRetention)).toMatchObject({
      label: 'Audit retention',
      description: expect.stringContaining('Off by default'),
    });
  });

  it('takes a pass at once across every company, then every six hours', async () => {
    const unref = jest.fn();
    const interval = jest
      .spyOn(globalThis, 'setInterval')
      .mockImplementation(() => ({ unref }) as unknown as NodeJS.Timeout);

    startAuditRetention();
    // Read before restoring: restoring a spy also forgets its calls.
    expect(interval).toHaveBeenCalledWith(expect.any(Function), SIX_HOURS);
    interval.mockRestore();
    expect(unref).toHaveBeenCalled();
    await eventually(() => lastSummary() !== undefined);
    expect(lastSummary()).toBe('Nothing aged out');
  });

  it('logs a pass that could not even list the companies', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(OrganizationModel, 'find').mockImplementationOnce(() => {
      throw new Error('database unreachable');
    });
    const interval = jest
      .spyOn(globalThis, 'setInterval')
      .mockImplementation(() => ({ unref: jest.fn() }) as unknown as NodeJS.Timeout);

    startAuditRetention();
    interval.mockRestore();

    await eventually(() => logged.mock.calls.length > 0);
    expect(logged).toHaveBeenCalledWith(expect.any(Error), 'Audit retention pass failed');
    expect(lastSummary()).toBeUndefined();
  });
});
