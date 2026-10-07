import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { JOB_KEYS, clearJobRuns, readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { imageUploader } from '../../../../src/utils/imagekit';
import { logger } from '../../../../src/utils/logger';
import { TrackerScreenshotModel } from '../../../../src/modules/tracker/models';
import { updateTrackerSettings } from '../../../../src/modules/tracker/tracker.settings.service';
import {
  runIfConfigured,
  startTrackerRetention,
} from '../../../../src/modules/tracker/tracker.retention';
import { useTestOrganization } from '../../../helpers';

const DAY = 86_400_000;
const HOUR = 3_600_000;

useTestOrganization();

/** Waits, on real timers, until `check` holds — the scheduled tick runs detached. */
async function eventually(check: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 250; attempt += 1) {
    if (check()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('The condition never held');
}

const lastSummary = () => readJobRuns().get(JOB_KEYS.trackerRetention)?.summary;

function screenshotAged(days: number, fileId: string) {
  const at = new Date(Date.now() - days * DAY);
  return TrackerScreenshotModel.create({
    userId: 'u1',
    sessionId: 's1',
    intervalStartedAt: at,
    capturedAt: at,
    imageUrl: 'https://ik.example/shot.png',
    fileId,
  });
}

beforeEach(() => clearJobRuns());
afterEach(() => jest.restoreAllMocks());

describe('runIfConfigured', () => {
  it('keeps every screenshot while retention is off (zero days)', async () => {
    const remove = jest.spyOn(imageUploader, 'deleteFile');
    await screenshotAged(400, 'ancient');

    await runIfConfigured();

    expect(remove).not.toHaveBeenCalled();
    expect(await TrackerScreenshotModel.countDocuments()).toBe(1);
    expect(lastSummary()).toBeUndefined();
  });

  it('purges what aged out, reports it, and logs the pass', async () => {
    jest.spyOn(imageUploader, 'deleteFile').mockResolvedValue(undefined);
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    await updateTrackerSettings({ screenshotRetentionDays: 30 });
    await screenshotAged(45, 'old');
    await screenshotAged(5, 'fresh');

    await runIfConfigured();

    expect(lastSummary()).toBe('Deleted 1, failed 0');
    expect(info).toHaveBeenCalledWith(
      { deleted: 1, orphaned: 0, failed: 0, retentionDays: 30 },
      'Tracker screenshot retention pass complete',
    );
    expect(await TrackerScreenshotModel.countDocuments()).toBe(1);
  });

  it('reports a pass with nothing to delete without logging it', async () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    await updateTrackerSettings({ screenshotRetentionDays: 30 });
    await screenshotAged(5, 'fresh');

    await runIfConfigured();

    expect(lastSummary()).toBe('Deleted 0, failed 0');
    expect(info).not.toHaveBeenCalled();
  });
});

describe('the retention job', () => {
  it('registers a Run now pass that runs the same check', async () => {
    jest.spyOn(imageUploader, 'deleteFile').mockResolvedValue(undefined);
    await updateTrackerSettings({ screenshotRetentionDays: 1 });
    await screenshotAged(3, 'old');

    await findBackgroundJob(JOB_KEYS.trackerRetention)?.runOnce();

    expect(lastSummary()).toBe('Deleted 1, failed 0');
    expect(findBackgroundJob(JOB_KEYS.trackerRetention)).toMatchObject({
      label: 'Screenshot retention',
    });
  });

  it('takes a pass at once across every company, then every hour', async () => {
    await updateTrackerSettings({ screenshotRetentionDays: 30 });
    const unref = jest.fn();
    const interval = jest
      .spyOn(globalThis, 'setInterval')
      .mockImplementation(() => ({ unref }) as unknown as NodeJS.Timeout);

    startTrackerRetention();
    expect(interval).toHaveBeenCalledWith(expect.any(Function), HOUR);
    interval.mockRestore();

    expect(unref).toHaveBeenCalled();
    await eventually(() => lastSummary() !== undefined);
    expect(lastSummary()).toBe('Deleted 0, failed 0');
  });

  it('logs a pass that could not even list the companies', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(OrganizationModel, 'find').mockImplementationOnce(() => {
      throw new Error('database unreachable');
    });
    const interval = jest
      .spyOn(globalThis, 'setInterval')
      .mockImplementation(() => ({ unref: jest.fn() }) as unknown as NodeJS.Timeout);

    startTrackerRetention();
    interval.mockRestore();

    await eventually(() => logged.mock.calls.length > 0);
    expect(logged).toHaveBeenCalledWith(
      expect.any(Error),
      'Tracker screenshot retention pass failed',
    );
  });
});
