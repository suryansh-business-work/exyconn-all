import { Types } from 'mongoose';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { JOB_KEYS, clearJobRuns, readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';
import { TrackerIntervalModel } from '../../../../src/modules/tracker/models';
import { updateTrackerSettings } from '../../../../src/modules/tracker/tracker.settings.service';
import {
  buildDigest,
  renderDigestRows,
  startTrackerDigest,
  weeklyWindow,
} from '../../../../src/modules/tracker/tracker.digest';
import { useTestOrganization } from '../../../helpers';

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

const lastSummary = () => readJobRuns().get(JOB_KEYS.trackerDigest)?.summary;
const quietTimer = () =>
  jest
    .spyOn(globalThis, 'setInterval')
    .mockImplementation(() => ({ unref: jest.fn() }) as unknown as NodeJS.Timeout);

beforeEach(() => {
  clearJobRuns();
  // Nobody holds the TRACKER role in these companies, so a due digest only warns.
  jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('the digest schedule', () => {
  it('checks every company at once, then once a minute', async () => {
    await updateTrackerSettings({ dailyDigestEnabled: true, digestHour: 0 });
    const unref = jest.fn();
    const interval = jest
      .spyOn(globalThis, 'setInterval')
      .mockImplementation(() => ({ unref }) as unknown as NodeJS.Timeout);

    startTrackerDigest();
    expect(interval).toHaveBeenCalledWith(expect.any(Function), 60_000);
    interval.mockRestore();

    expect(unref).toHaveBeenCalled();
    await eventually(() => lastSummary() !== undefined);
    expect(lastSummary()).toMatch(/^Checked digests for \d{4}-\d{2}-\d{2}$/);
  });

  it('logs a check that could not even list the companies', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(OrganizationModel, 'find').mockImplementationOnce(() => {
      throw new Error('database unreachable');
    });
    const interval = quietTimer();

    startTrackerDigest();
    interval.mockRestore();

    await eventually(() => logged.mock.calls.length > 0);
    expect(logged).toHaveBeenCalledWith(expect.any(Error), 'Tracker digest check failed');
  });

  it('registers a Run now pass that is the same check', async () => {
    await updateTrackerSettings({ dailyDigestEnabled: true, digestHour: 0 });

    await findBackgroundJob(JOB_KEYS.trackerDigest)?.runOnce();

    expect(lastSummary()).toMatch(/^Checked digests for /);
    expect(findBackgroundJob(JOB_KEYS.trackerDigest)).toMatchObject({ label: 'Tracker digests' });
  });
});

describe('the digest body', () => {
  it('shows off-computer hours beside tracked ones, and a dash when there were none', () => {
    const html = renderDigestRows([
      { name: 'Asha', activeMs: 2 * HOUR, manualMs: 90 * 60_000 },
      { name: 'Dev', activeMs: HOUR, manualMs: 0 },
    ]);

    expect(html).toContain('<td style="padding:6px 0;">Asha</td>');
    expect(html).toContain('1.5h off-computer');
    expect(html).toContain('>1h</td>');
    expect(html).toContain('>—</td>');
  });

  it('escapes quotes and ampersands in a name', () => {
    expect(renderDigestRows([{ name: 'Tom & "Jo"', activeMs: HOUR, manualMs: 0 }])).toContain(
      'Tom &amp; &quot;Jo&quot;',
    );
  });

  it('credits time to a deleted account rather than dropping it', async () => {
    const now = Date.now();
    await TrackerIntervalModel.create({
      userId: new Types.ObjectId().toHexString(),
      sessionId: 's1',
      startedAt: new Date(now - 2 * HOUR),
      endedAt: new Date(now - HOUR),
      activeMs: HOUR,
    });

    const digest = await buildDigest(new Date(now - 24 * HOUR), new Date(now), 'today');

    expect(digest.rows).toEqual([{ name: 'Deleted employee', activeMs: HOUR, manualMs: 0 }]);
    expect(digest.totalHours).toBe(1);
  });

  it('labels the weekly window with both ends of the week', () => {
    const window = weeklyWindow(new Date('2026-09-07T09:00:00.000Z'), 'UTC');

    expect(window.label).toBe('from 2026-08-31 to 2026-09-07');
    expect(window.to.getTime() - window.from.getTime()).toBe(7 * 24 * HOUR);
  });
});
