import {
  clearReminderSources,
  dayKey,
  daysFromNow,
  registerReminderSource,
  startReminderSweep,
} from '../../../../src/modules/reminders';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { JOB_KEYS, clearJobRuns, readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';
import { useTestOrganization } from '../../../helpers';

const HOUR = 60 * 60 * 1000;

/** Waits, on real timers, until `check` holds — the sweep's first tick runs detached. */
async function eventually(check: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 250; attempt += 1) {
    if (check()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('The condition never held');
}

const lastSummary = () => readJobRuns().get(JOB_KEYS.reminders)?.summary;

/** One source with nothing due and one that always throws. */
function registerQuietAndBrokenSources() {
  clearReminderSources();
  registerReminderSource({ key: 'quiet', label: 'Quiet', due: async () => [] });
  registerReminderSource({
    key: 'broken',
    label: 'Broken',
    due: () => Promise.reject(new Error('source down')),
  });
}

/** Stands in for the hourly timer so a test never leaves one running. */
const stubInterval = (unref = jest.fn()) =>
  jest
    .spyOn(globalThis, 'setInterval')
    .mockImplementation(() => ({ unref }) as unknown as NodeJS.Timeout);

describe('the reminder sweep loop', () => {
  useTestOrganization();

  beforeEach(() => {
    clearJobRuns();
    registerQuietAndBrokenSources();
  });
  afterEach(() => jest.restoreAllMocks());

  it('sweeps every company at once, then every hour, and reports what it did', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const unref = jest.fn();
    const interval = stubInterval(unref);

    startReminderSweep();
    // Read before restoring: restoring a spy also forgets its calls.
    expect(interval).toHaveBeenCalledWith(expect.any(Function), HOUR);
    interval.mockRestore();
    expect(unref).toHaveBeenCalled();

    await eventually(() => lastSummary() !== undefined);
    expect(lastSummary()).toBe('0 reminder(s) sent, 1 source(s) failed');
    expect(logged).toHaveBeenCalledWith(expect.any(Error), 'Reminder source "broken" failed');
  });

  it('logs a sweep that could not even list the companies', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(OrganizationModel, 'find').mockImplementationOnce(() => {
      throw new Error('database unreachable');
    });
    const interval = stubInterval();

    startReminderSweep();
    interval.mockRestore();

    await eventually(() => logged.mock.calls.length > 0);
    expect(logged).toHaveBeenCalledWith(expect.any(Error), 'Reminder sweep failed');
    expect(lastSummary()).toBeUndefined();
  });

  it('registers a Run now pass that is the same sweep the timer takes', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const job = findBackgroundJob(JOB_KEYS.reminders);

    expect(job).toMatchObject({ label: 'Reminder sweep' });
    await expect(job?.runOnce()).resolves.toEqual({ sent: 0, failed: 1 });
  });
});

describe('reminder dates', () => {
  const now = new Date('2026-09-20T22:30:00.000Z');

  it('keys a day by its UTC date', () => {
    expect(dayKey(now)).toBe('2026-09-20');
  });

  it('moves forwards and backwards by whole days', () => {
    expect(daysFromNow(now, 3).toISOString()).toBe('2026-09-23T22:30:00.000Z');
    expect(daysFromNow(now, -1).toISOString()).toBe('2026-09-19T22:30:00.000Z');
  });
});
