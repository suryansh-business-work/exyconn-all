import { randomUUID } from 'node:crypto';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { AppSettingsModel } from '../../../../src/modules/admin/settings.model';
import { emailer } from '../../../../src/modules/email/email.service';
import { RawHtml } from '../../../../src/modules/email/email.render';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { logger } from '../../../../src/utils/logger';
import { JOB_KEYS, clearJobRuns, readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { TrackerIntervalModel, TrackerSettingsModel } from '../../../../src/modules/tracker/models';
import { updateTrackerSettings } from '../../../../src/modules/tracker/tracker.settings.service';
import { runDueDigests } from '../../../../src/modules/tracker/tracker.digest';
import { freezeClock } from '../../../helpers';

/** 2026-09-07 is a Monday — the day the weekly summary goes out. */
const MONDAY_10AM = '2026-09-07T10:00:00.000Z';
const HOUR = 3_600_000;

let send: jest.SpyInstance;

async function person(name: string, roles: Role[], isActive = true) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase()}-${randomUUID()}@exyconn.com`,
    passwordHash: randomUUID(),
    roles,
    isActive,
  });
  return { id: String(user._id), email: user.email };
}

async function workedYesterday(userId: string) {
  await TrackerIntervalModel.create({
    userId,
    sessionId: 's1',
    startedAt: new Date('2026-09-06T15:00:00.000Z'),
    endedAt: new Date('2026-09-06T17:00:00.000Z'),
    activeMs: 2 * HOUR,
  });
}

const settings = () => TrackerSettingsModel.findOne({ key: 'global' }).lean();
const sentTo = () => send.mock.calls.map(([input]) => (input as { to: string }).to);

beforeEach(() => {
  clearJobRuns();
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('runDueDigests', () => {
  it('does nothing at all while both digests are off', async () => {
    freezeClock(MONDAY_10AM);
    await person('Manager', [ROLES.TRACKER]);

    await runDueDigests();

    expect(send).not.toHaveBeenCalled();
    expect(readJobRuns().get(JOB_KEYS.trackerDigest)).toBeUndefined();
  });

  it('mails yesterday to every active tracker manager and admin, once', async () => {
    freezeClock(MONDAY_10AM);
    const manager = await person('Manager', [ROLES.TRACKER]);
    const admin = await person('Owner', [ROLES.ADMIN]);
    await person('Former', [ROLES.TRACKER], false);
    const worker = await person('Worker', [ROLES.EMPLOYEE]);
    await workedYesterday(worker.id);
    await updateTrackerSettings({ dailyDigestEnabled: true, digestHour: 9 });

    await runDueDigests();
    await runDueDigests();

    expect(sentTo().sort((a, b) => a.localeCompare(b))).toEqual(
      [manager.email, admin.email].sort((a, b) => a.localeCompare(b)),
    );
    expect(send).toHaveBeenCalledWith({
      template: 'tracker-digest',
      to: manager.email,
      variables: {
        periodLabel: 'on 2026-09-06',
        rows: expect.any(RawHtml),
        totalHours: '2',
        employeeCount: '1',
        name: 'Manager',
      },
      triggeredBy: 'tracker digest schedule',
    });
    await expect(settings()).resolves.toMatchObject({ dailyDigestLastRun: '2026-09-07' });
    expect(readJobRuns().get(JOB_KEYS.trackerDigest)?.summary).toBe(
      'Checked digests for 2026-09-07',
    );
  });

  it('sends the weekly summary on a Monday, covering the seven days just ended', async () => {
    freezeClock(MONDAY_10AM);
    await person('Manager', [ROLES.TRACKER]);
    await updateTrackerSettings({ weeklyDigestEnabled: true, digestHour: 9 });

    await runDueDigests();

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toMatchObject({
      variables: { periodLabel: 'from 2026-08-31 to 2026-09-07', employeeCount: '0' },
    });
    await expect(settings()).resolves.toMatchObject({ weeklyDigestLastRun: '2026-09-07' });
  });

  it('holds the weekly summary on any other day of the week', async () => {
    freezeClock('2026-09-08T10:00:00.000Z');
    await person('Manager', [ROLES.TRACKER]);
    await updateTrackerSettings({ weeklyDigestEnabled: true, digestHour: 9 });

    await runDueDigests();

    expect(send).not.toHaveBeenCalled();
    expect(readJobRuns().get(JOB_KEYS.trackerDigest)?.summary).toBe(
      'Checked digests for 2026-09-08',
    );
  });

  it('reads the clock in the house timezone when the tracker has none of its own', async () => {
    // 20:00 UTC on Monday is already 01:30 on Tuesday in Kolkata.
    freezeClock('2026-09-07T20:00:00.000Z');
    await AppSettingsModel.create({ timezone: 'Asia/Kolkata' });
    await person('Manager', [ROLES.TRACKER]);
    await updateTrackerSettings({ dailyDigestEnabled: true, digestHour: 1 });

    await runDueDigests();

    expect(send.mock.calls[0][0]).toMatchObject({ variables: { periodLabel: 'on 2026-09-07' } });
    await expect(settings()).resolves.toMatchObject({ dailyDigestLastRun: '2026-09-08' });
  });

  it('records the run but sends nothing when nobody administers the tracker', async () => {
    freezeClock(MONDAY_10AM);
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    await updateTrackerSettings({ dailyDigestEnabled: true, digestHour: 9 });

    await runDueDigests();

    expect(send).not.toHaveBeenCalled();
    expect(warned).toHaveBeenCalledWith(
      'Tracker digest is on but nobody holds the TRACKER role; nothing sent',
    );
    await expect(settings()).resolves.toMatchObject({ dailyDigestLastRun: '2026-09-07' });
  });

  it('keeps mailing the other managers when one address fails', async () => {
    freezeClock(MONDAY_10AM);
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const first = await person('Alpha', [ROLES.TRACKER]);
    const second = await person('Beta', [ROLES.TRACKER]);
    const failure = new Error('mailbox full');
    send.mockRejectedValueOnce(failure);
    await updateTrackerSettings({ dailyDigestEnabled: true, digestHour: 9 });

    await runDueDigests();

    expect(send).toHaveBeenCalledTimes(2);
    const failedTo = sentTo()[0];
    expect([first.email, second.email]).toContain(failedTo);
    expect(logged).toHaveBeenCalledWith(
      { error: failure, to: failedTo },
      'Tracker digest send failed',
    );
  });
});
