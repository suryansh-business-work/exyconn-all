import { UserModel } from '../../src/modules/admin/user.model';
import { hashPassword } from '../../src/utils/password';
import { ROLES } from '../../src/constants/roles';
import { verifyToken } from '../../src/utils/jwt';
import { trackerDeviceService } from '../../src/modules/tracker/tracker.device.service';
import { assertTrackerDevice } from '../../src/modules/tracker/tracker.auth';
import { trackerAdminService } from '../../src/modules/tracker/tracker.admin.service';
import {
  TrackerAccessModel,
  TrackerIntervalModel,
  TrackerSessionModel,
} from '../../src/modules/tracker/models';

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
    await expect(
      trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE),
    ).rejects.toThrow(/access to the tracker/i);
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
    const me = await trackerDeviceService.me(user.id);

    expect(me.user.email).toBe('emp@exyconn.com');
    expect(me.consentRequired).toBe(true);
    expect(me.settings.consentText.length).toBeGreaterThan(0);
  });

  it('refuses to rehydrate once access is revoked', async () => {
    const user = await makeEmployee();
    await trackerAdminService.grantAccess(user.id, 'admin');
    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);

    await trackerAdminService.revokeAccess(user.id, 'admin');

    await expect(trackerDeviceService.me(user.id)).rejects.toThrow(/revoked/i);
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
