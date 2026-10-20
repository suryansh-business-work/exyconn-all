import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { emailer } from '../../../../src/modules/email';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { TrackerAccessModel, TrackerSessionModel } from '../../../../src/modules/tracker/models';
import {
  runEmployeeReports,
  startEmployeeReports,
} from '../../../../src/modules/tracker/tracker.employee-reports';
import { updateTrackerSettings } from '../../../../src/modules/tracker/tracker.settings.service';
import { JOB_KEYS, clearJobRuns, readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';
import { useTestOrganization } from '../../../helpers';

useTestOrganization({ locale: 'en-GB' });

const HOUR = 3_600_000;
// Wednesday 7 January 2026, half past eight in the evening in London.
const EVENING = new Date('2026-01-07T20:30:00Z');

let send: jest.SpyInstance;
beforeEach(() => {
  clearJobRuns();
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
});
afterEach(() => jest.restoreAllMocks());

/** A tracked employee who worked on `day`, reading their hours in `timezone`. */
async function tracked(timezone: string, isActive = true, day = '2026-01-07') {
  const user = await UserModel.create({
    name: 'Asha',
    email: `${new Types.ObjectId().toHexString()}@exyconn.com`,
    passwordHash: 'x',
    workHoursPerDay: 8,
  });
  const id = user._id.toHexString();
  await TrackerAccessModel.create({ userId: id, grantedBy: 'admin', isActive, timezone });
  await TrackerSessionModel.create({
    userId: id,
    deviceId: 'd1',
    startedAt: new Date(`${day}T09:00:00Z`),
    status: 'stopped',
    activeMs: 3 * HOUR,
  });
  return { id, email: user.email };
}

const recipients = () => send.mock.calls.map(([options]) => options.to);
const lastSummary = () => readJobRuns().get(JOB_KEYS.trackerEmployeeReports)?.summary;

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

describe('runEmployeeReports', () => {
  it('mails only active trackers whose own evening hour has come', async () => {
    const london = await tracked('Europe/London');
    // 15:30 in New York: not yet.
    await tracked('America/New_York');
    // Revoked access: never.
    await tracked('Europe/London', false);

    await expect(runEmployeeReports(EVENING)).resolves.toBe(1);

    expect(recipients()).toEqual([london.email]);
    expect(lastSummary()).toBe('Sent 1 employee reports');
  });

  it('sends nothing before the report hour, and each report once', async () => {
    await tracked('UTC');

    await expect(runEmployeeReports(new Date('2026-01-07T19:59:00Z'))).resolves.toBe(0);
    expect(lastSummary()).toBe('Sent 0 employee reports');

    await expect(runEmployeeReports(EVENING)).resolves.toBe(1);
    await expect(runEmployeeReports(new Date('2026-01-07T23:00:00Z'))).resolves.toBe(0);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('follows the hour and the periods set in Tracker settings', async () => {
    await tracked('UTC');
    await updateTrackerSettings({ employeeReportHour: 9 });

    await expect(runEmployeeReports(new Date('2026-01-07T09:00:00Z'))).resolves.toBe(1);

    await tracked('UTC', true, '2026-01-08');
    await updateTrackerSettings({ employeeDailyReportEnabled: false });
    await expect(runEmployeeReports(new Date('2026-01-08T21:00:00Z'))).resolves.toBe(0);
  });

  it('sends the day, the week and the month when a Sunday ends the month', async () => {
    await tracked('UTC', true, '2026-05-31');

    await expect(runEmployeeReports(new Date('2026-05-31T21:00:00Z'))).resolves.toBe(3);

    expect(send.mock.calls.map(([options]) => options.attachments?.[0]?.filename)).toEqual([
      undefined,
      'hours-2026-05-25-to-2026-05-31.pdf',
      'hours-2026-05-01-to-2026-05-31.pdf',
    ]);
  });

  it('logs a report that failed and carries on with the next employee', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const first = await tracked('UTC');
    await tracked('UTC');
    send.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(runEmployeeReports(EVENING)).resolves.toBe(1);

    expect(send).toHaveBeenCalledTimes(2);
    expect(logged).toHaveBeenCalledWith(
      { err: expect.any(Error), userId: first.id, period: 'DAY' },
      'Tracker employee report failed',
    );
  });
});

describe('the employee report schedule', () => {
  it('checks every company every five minutes, on a timer that never holds the process', async () => {
    const unref = jest.fn();
    const interval = jest
      .spyOn(globalThis, 'setInterval')
      .mockImplementation(() => ({ unref }) as unknown as NodeJS.Timeout);
    jest.spyOn(logger, 'info').mockImplementation(() => undefined);

    startEmployeeReports();
    expect(interval).toHaveBeenCalledWith(expect.any(Function), 5 * 60_000);
    expect(unref).toHaveBeenCalled();
    const tick = interval.mock.calls[0][0] as () => void;
    interval.mockRestore();

    tick();
    await eventually(() => lastSummary() !== undefined);
    expect(lastSummary()).toMatch(/^Sent \d+ employee reports$/);
  });

  it('logs a check that could not even list the companies', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(OrganizationModel, 'find').mockImplementationOnce(() => {
      throw new Error('database unreachable');
    });
    const interval = jest
      .spyOn(globalThis, 'setInterval')
      .mockImplementation(() => ({ unref: jest.fn() }) as unknown as NodeJS.Timeout);
    jest.spyOn(logger, 'info').mockImplementation(() => undefined);

    startEmployeeReports();
    const tick = interval.mock.calls[0][0] as () => void;
    interval.mockRestore();
    tick();

    await eventually(() => logged.mock.calls.length > 0);
    expect(logged).toHaveBeenCalledWith(expect.any(Error), 'Tracker employee reports check failed');
  });

  it('registers a Run now pass that is the same check', async () => {
    const job = findBackgroundJob(JOB_KEYS.trackerEmployeeReports);

    await job?.runOnce();

    expect(job).toMatchObject({ label: 'Tracker employee reports' });
    expect(lastSummary()).toMatch(/^Sent \d+ employee reports$/);
  });
});
