import { UserModel } from '../../src/modules/admin/user.model';
import { hashPassword } from '../../src/utils/password';
import { ROLES } from '../../src/constants/roles';
import { verifyToken } from '../../src/utils/jwt';
import { trackerDeviceService } from '../../src/modules/tracker/tracker.device.service';
import { assertTrackerDevice } from '../../src/modules/tracker/tracker.auth';
import { trackerAdminService } from '../../src/modules/tracker/tracker.admin.service';
import {
  TrackerAccessModel,
  TrackerDeviceModel,
  TrackerIntervalModel,
  TrackerSessionModel,
} from '../../src/modules/tracker/models';
import { updateTrackerSettings } from '../../src/modules/tracker/tracker.settings.service';

// The mailer talks to SMTP; stub the access-granted email so grants work offline.
jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendTrackerAccessEmail: jest.fn().mockResolvedValue(undefined) },
}));

const PASSWORD = 'Tracked@123';
const DEVICE = { deviceId: 'device-1', platform: 'win32', hostname: 'PC', appVersion: '1.0.0' };

async function makeEmployee(email = 'emp@exyconn.com') {
  const passwordHash = await hashPassword(PASSWORD);
  return UserModel.create({ name: 'Emp', email, passwordHash, roles: [ROLES.EMPLOYEE] });
}

function ctxFor(token: string) {
  return { user: verifyToken(token) };
}

describe('tracker device auth', () => {
  it('refuses login without an access grant', async () => {
    await makeEmployee();
    await expect(trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE)).rejects.toThrow(
      /access to the tracker/i,
    );
  });

  it('issues a non-expiring device token once access is granted', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');

    const result = await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);

    const decoded = verifyToken(result.token);
    expect(decoded?.deviceId).toBe('device-1');
    // A device token must never expire — the employee is not meant to sign in again.
    const payload = JSON.parse(
      Buffer.from(result.token.split('.')[1], 'base64url').toString(),
    ) as Record<string, unknown>;
    expect(payload.exp).toBeUndefined();
    expect(result.consentRequired).toBe(true);
  });

  it('rejects tracker calls from a revoked device', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    const { token } = await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);

    await expect(assertTrackerDevice(ctxFor(token))).resolves.toMatchObject({ userId: user.id });

    await trackerAdminService.revokeDevice('device-1');
    await expect(assertTrackerDevice(ctxFor(token))).rejects.toThrow(/revoked/i);
  });

  it('rejects tracker calls after access is revoked (kills every device)', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    const { token } = await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);

    await trackerAdminService.revokeAccess(user.id, 'admin');
    await expect(assertTrackerDevice(ctxFor(token))).rejects.toThrow(/revoked/i);
  });
});

describe('tracker sync', () => {
  async function grantedSession() {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);
    await trackerDeviceService.acceptConsent(user.id);
    const session = await trackerDeviceService.startSession(user.id, 'device-1', new Date());
    return { user, sessionId: String((session as { _id: unknown })._id) };
  }

  it('gates session start on accepted consent', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);
    await expect(
      trackerDeviceService.startSession(user.id, 'device-1', new Date()),
    ).rejects.toThrow(/disclosure/i);
  });

  it('stores intervals and rolls totals up onto the session', async () => {
    const { user, sessionId } = await grantedSession();
    const startedAt = new Date('2026-07-13T09:00:00.000Z');
    const endedAt = new Date('2026-07-13T09:10:00.000Z');

    await trackerDeviceService.syncIntervals(user.id, sessionId, [
      {
        startedAt,
        endedAt,
        keyCount: 120,
        mouseCount: 40,
        activeMs: 480_000,
        idleMs: 120_000,
        windows: [{ appName: 'Code', windowTitle: 'file.ts', durationMs: 600_000 }],
      },
    ]);

    const interval = await TrackerIntervalModel.findOne({ sessionId }).lean();
    expect(interval?.activityPercent).toBe(80);

    const session = await TrackerSessionModel.findById(sessionId).lean();
    expect(session?.keyCount).toBe(120);
    expect(session?.activeMs).toBe(480_000);
  });

  it('is idempotent — re-syncing the same interval does not double-count', async () => {
    const { user, sessionId } = await grantedSession();
    const interval = {
      startedAt: new Date('2026-07-13T09:00:00.000Z'),
      endedAt: new Date('2026-07-13T09:10:00.000Z'),
      keyCount: 50,
      mouseCount: 10,
      activeMs: 300_000,
      idleMs: 300_000,
    };

    await trackerDeviceService.syncIntervals(user.id, sessionId, [interval]);
    await trackerDeviceService.syncIntervals(user.id, sessionId, [interval]);

    await expect(TrackerIntervalModel.countDocuments({ sessionId })).resolves.toBe(1);
    const session = await TrackerSessionModel.findById(sessionId).lean();
    expect(session?.keyCount).toBe(50);
  });
});

describe('tracker device info', () => {
  it('persists the machine id and hardware details on login', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');

    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, {
      ...DEVICE,
      machineId: 'MACHINE-GUID-123',
      osName: 'Windows_NT',
      osVersion: '10.0.26200',
      arch: 'x64',
      cpuModel: 'AMD Ryzen 9',
      cpuCores: 16,
      totalMemoryMb: 32768,
      locale: 'en-IN',
      timezone: 'Asia/Kolkata',
      screenCount: 2,
      screenResolution: '2560x1440',
    });

    const devices = await trackerAdminService.listDevices(user.id);
    expect(devices[0]).toMatchObject({
      machineId: 'MACHINE-GUID-123',
      cpuCores: 16,
      totalMemoryMb: 32768,
      screenCount: 2,
      screenResolution: '2560x1440',
    });
  });
});

describe('trackerMe (remember-me rehydrate)', () => {
  it('rebuilds the session from a stored device token', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);

    // What a "remembered" app does on relaunch: it has a token but no user/settings in
    // memory. Without this, the app would hold a valid token yet show the login screen.
    const me = await trackerDeviceService.me(user.id, 'device-1');

    expect(me.user.email).toBe('emp@exyconn.com');
    expect(me.consentRequired).toBe(true);
    expect(me.settings.consentText.length).toBeGreaterThan(0);
  });

  it('refuses to rehydrate once access is revoked', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);

    await trackerAdminService.revokeAccess(user.id, 'admin');

    await expect(trackerDeviceService.me(user.id, 'device-1')).rejects.toThrow(/revoked/i);
  });
});

describe('tracker heartbeat', () => {
  it('records that the device is still online', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);

    // Rewind lastSeenAt to what an enrolment an hour ago looks like: without a heartbeat the
    // portal's Devices console can only ever show this, and "Last seen" means nothing.
    const stale = new Date(Date.now() - 3_600_000);
    await TrackerDeviceModel.updateOne({ deviceId: 'device-1' }, { lastSeenAt: stale });

    await trackerDeviceService.heartbeat(user.id, 'device-1');

    const device = await TrackerDeviceModel.findOne({ deviceId: 'device-1' }).lean();
    expect(device?.lastSeenAt.getTime()).toBeGreaterThan(stale.getTime());
  });

  it('hands back settings an admin changed after the app signed in', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    const signedIn = await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);
    expect(signedIn.settings.intervalMinutes).not.toBe(3);

    await updateTrackerSettings({ intervalMinutes: 3, blurScreenshots: true });

    // This is what keeps a RUNNING app in step with the portal: the same round-trip that says
    // "still here" answers with the rules the app should now be tracking by.
    const state = await trackerDeviceService.heartbeat(user.id, 'device-1');
    expect(state.settings.intervalMinutes).toBe(3);
    expect(state.settings.blurScreenshots).toBe(true);
  });

  it('refreshes the app version after an update, without a fresh sign-in', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);

    // The device token never expires, so an updated app restores its session rather than
    // signing in again — the console would otherwise show 1.0.0 forever.
    await trackerDeviceService.heartbeat(user.id, 'device-1', {
      ...DEVICE,
      appVersion: '1.2.0',
      screenCount: 2,
    });

    const devices = await trackerAdminService.listDevices(user.id);
    expect(devices[0]).toMatchObject({ appVersion: '1.2.0', screenCount: 2 });
  });

  it('cannot re-enrol a device or undo a revocation', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);
    await trackerAdminService.revokeDevice('device-1');

    // The auth guard already refuses a revoked device; this pins down that the write itself
    // touches only the descriptive fields, so no payload can talk its way back in.
    await trackerDeviceService.heartbeat(user.id, 'device-1', { ...DEVICE, hostname: 'NEW-PC' });

    const device = await TrackerDeviceModel.findOne({ deviceId: 'device-1' }).lean();
    expect(device?.isActive).toBe(false);
    expect(device?.revokedAt).not.toBeNull();
    expect(device?.hostname).toBe('NEW-PC');
  });

  it('reports consent as accepted once the employee accepts it', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);

    await expect(trackerDeviceService.heartbeat(user.id, 'device-1')).resolves.toMatchObject({
      consentRequired: true,
    });

    await trackerDeviceService.acceptConsent(user.id);

    await expect(trackerDeviceService.heartbeat(user.id, 'device-1')).resolves.toMatchObject({
      consentRequired: false,
    });
  });

  it('refuses once access is revoked, so an idle app finds out', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);

    await trackerAdminService.revokeAccess(user.id, 'admin');

    await expect(trackerDeviceService.heartbeat(user.id, 'device-1')).rejects.toThrow(/revoked/i);
  });
});

describe('tracker consent record', () => {
  it('marks consent on the access grant', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);
    await trackerDeviceService.acceptConsent(user.id);

    const access = await TrackerAccessModel.findOne({ userId: user.id }).lean();
    expect(access?.consentedAt).toBeTruthy();
  });
});
