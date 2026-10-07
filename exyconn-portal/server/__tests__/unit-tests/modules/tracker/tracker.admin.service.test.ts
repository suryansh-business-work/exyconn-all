import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { mailer } from '../../../../src/utils/mailer';
import { logger } from '../../../../src/utils/logger';
import { trackerAdminService } from '../../../../src/modules/tracker/tracker.admin.service';
import {
  TrackerDeviceModel,
  TrackerManualEntryModel,
  TrackerSessionModel,
} from '../../../../src/modules/tracker/models';
import { codeOf } from '../codeOf';

jest.mock('../../../../src/utils/mailer', () => ({
  mailer: { sendTrackerAccessEmail: jest.fn() },
}));

const sendAccessEmail = jest.mocked(mailer.sendTrackerAccessEmail);
const HOUR = 3_600_000;

async function employee(name = 'Asha') {
  const user = await UserModel.create({
    name,
    email: `${randomUUID()}@exyconn.com`,
    passwordHash: randomUUID(),
  });
  return { id: String(user._id), email: user.email };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

afterEach(() => {
  jest.restoreAllMocks();
});

describe('granting tracker access', () => {
  it('emails the employee the note that tracking is about to start', async () => {
    sendAccessEmail.mockResolvedValueOnce(undefined);
    const user = await employee('Asha');

    const access = await trackerAdminService.grantAccess(user.id, 'admin-1');

    expect(access).toMatchObject({ userId: user.id, grantedBy: 'admin-1', isActive: true });
    expect(sendAccessEmail).toHaveBeenCalledWith({ name: 'Asha', email: user.email });
  });

  it('still grants access when the email is refused, and logs why', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const failure = new Error('SMTP down');
    sendAccessEmail.mockRejectedValueOnce(failure);
    const user = await employee();

    await expect(trackerAdminService.grantAccess(user.id, 'admin-1')).resolves.toMatchObject({
      isActive: true,
    });
    await settle();

    expect(logged).toHaveBeenCalledWith({ error: failure }, 'Tracker access email failed');
  });

  it('still grants access when the mailer throws before sending anything', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const failure = new Error('No email configuration');
    sendAccessEmail.mockImplementationOnce(() => {
      throw failure;
    });
    const user = await employee();

    await expect(trackerAdminService.grantAccess(user.id, 'admin-1')).resolves.toMatchObject({
      isActive: true,
    });
    expect(logged).toHaveBeenCalledWith({ error: failure }, 'Tracker access email failed');
  });

  it('refuses an account that does not exist', async () => {
    const attempt = trackerAdminService.grantAccess(new Types.ObjectId().toString(), 'admin-1');

    await expect(codeOf(attempt)).resolves.toBe('NOT_FOUND');
  });
});

describe('revoking', () => {
  it('refuses to revoke access that was never granted', async () => {
    const attempt = trackerAdminService.revokeAccess(new Types.ObjectId().toString(), 'admin-1');

    await expect(attempt).rejects.toThrow('Tracker access not found');
  });

  it('refuses to revoke a device that was never enrolled', async () => {
    await expect(trackerAdminService.revokeDevice('nope')).rejects.toThrow('Device not found');
  });

  it('records who revoked access and fills in the fields an old grant predates', async () => {
    sendAccessEmail.mockResolvedValueOnce(undefined);
    const user = await employee();
    await trackerAdminService.grantAccess(user.id, 'admin-1');

    const access = await trackerAdminService.revokeAccess(user.id, 'admin-2');

    expect(access).toMatchObject({ isActive: false, revokedBy: 'admin-2', presence: 'WORKING' });
    expect(access.revokedAt).toBeInstanceOf(Date);
  });
});

describe('listing devices', () => {
  it("lists one employee's devices, or every device when no employee is named", async () => {
    const base = { tokenHash: 'h', platform: 'win32' };
    await TrackerDeviceModel.create([
      { ...base, userId: 'u1', deviceId: 'd1', lastSeenAt: new Date(Date.now() - HOUR) },
      { ...base, userId: 'u1', deviceId: 'd2', lastSeenAt: new Date() },
      { ...base, userId: 'u2', deviceId: 'd3' },
    ]);

    const mine = await trackerAdminService.listDevices('u1');
    const all = await trackerAdminService.listDevices();

    // Most recently seen first: that is the machine somebody is actually using.
    expect(mine.map((device) => device.deviceId)).toEqual(['d2', 'd1']);
    expect(all).toHaveLength(3);
  });
});

describe('the calendar', () => {
  const FROM = new Date('2026-09-01T00:00:00.000Z');
  const TO = new Date('2026-09-30T00:00:00.000Z');

  function session(userId: string, startedAt: string, activeMs: number) {
    return TrackerSessionModel.create({
      userId,
      deviceId: 'd1',
      startedAt: new Date(startedAt),
      status: 'stopped',
      activeMs,
      idleMs: 1000,
      keyCount: 5,
      mouseCount: 2,
    });
  }

  function approved(userId: string, startedAt: string, durationMs: number) {
    const start = new Date(startedAt);
    return TrackerManualEntryModel.create({
      userId,
      startedAt: start,
      endedAt: new Date(start.getTime() + durationMs),
      durationMs,
      note: 'Client workshop',
      status: 'APPROVED',
    });
  }

  it('merges tracked and approved off-computer time by day, in date order', async () => {
    await session('u1', '2026-09-03T09:00:00.000Z', HOUR);
    await session('u1', '2026-09-03T14:00:00.000Z', 2 * HOUR);
    await approved('u1', '2026-09-03T16:00:00.000Z', HOUR);
    // A day spent entirely in meetings: no session at all, and it must still show.
    await approved('u1', '2026-09-02T10:00:00.000Z', 3 * HOUR);
    await session('u2', '2026-09-03T09:00:00.000Z', 5 * HOUR);

    const days = await trackerAdminService.calendar('u1', FROM, TO, 'UTC');

    expect(days).toEqual([
      {
        date: '2026-09-02',
        activeMs: 0,
        idleMs: 0,
        keyCount: 0,
        mouseCount: 0,
        sessions: 0,
        manualMs: 3 * HOUR,
      },
      {
        date: '2026-09-03',
        activeMs: 3 * HOUR,
        idleMs: 2000,
        keyCount: 10,
        mouseCount: 4,
        sessions: 2,
        manualMs: HOUR,
      },
    ]);
  });

  it('buckets a session on the local day it started in', async () => {
    // 20:00 UTC is already 01:30 the next day in Kolkata.
    await session('u1', '2026-09-03T20:00:00.000Z', HOUR);

    const days = await trackerAdminService.calendar('u1', FROM, TO, 'Asia/Kolkata');

    expect(days.map((day) => [day.date, day.manualMs])).toEqual([['2026-09-04', 0]]);
  });
});
