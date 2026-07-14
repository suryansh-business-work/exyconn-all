import { randomUUID } from 'node:crypto';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import { trackerAdminService } from '../../src/modules/tracker/tracker.admin.service';
import { trackerDeviceService } from '../../src/modules/tracker/tracker.device.service';
import { updateTrackerSettings } from '../../src/modules/tracker/tracker.settings.service';
import {
  FALLBACK_TIMEZONE,
  isValidTimezone,
  resolveEffectiveTimezone,
} from '../../src/modules/tracker/tracker.timezone';
import { TrackerAccessModel, TrackerDeviceModel } from '../../src/modules/tracker/models';

jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendTrackerAccessEmail: jest.fn().mockResolvedValue(undefined) },
}));

const DEVICE_ID = 'device-tz';

async function grantedEmployee(deviceTimezone = '') {
  const user = await UserModel.create({
    name: 'Emp',
    email: 'tz@exyconn.com',
    // Nothing in this suite signs in — the services are called directly with the userId a
    // device token would have authenticated as, so the hash only has to exist.
    passwordHash: randomUUID(),
    roles: [ROLES.EMPLOYEE],
  });
  await trackerAdminService.grantAccess(user.id, 'admin');
  await TrackerDeviceModel.create({
    userId: user.id,
    deviceId: DEVICE_ID,
    tokenHash: 'hash',
    platform: 'win32',
    timezone: deviceTimezone,
  });
  return user;
}

describe('isValidTimezone', () => {
  it.each(['Asia/Kolkata', 'America/New_York', 'Europe/Paris', 'UTC'])('accepts %s', (zone) => {
    expect(isValidTimezone(zone)).toBe(true);
  });

  it.each(['Not/AZone', 'Mars/Phobos', 'definitely not a zone', '', null, undefined])(
    'rejects %s',
    (zone) => {
      expect(isValidTimezone(zone)).toBe(false);
    },
  );
});

describe('resolveEffectiveTimezone', () => {
  it("prefers the employee's own pick", () => {
    expect(
      resolveEffectiveTimezone({
        employeeTimezone: 'Asia/Kolkata',
        defaultTimezone: 'Europe/Paris',
        deviceTimezone: 'America/New_York',
      }),
    ).toBe('Asia/Kolkata');
  });

  it('falls back to the admin default when the employee never picked one', () => {
    expect(
      resolveEffectiveTimezone({
        employeeTimezone: '',
        defaultTimezone: 'Europe/Paris',
        deviceTimezone: 'America/New_York',
      }),
    ).toBe('Europe/Paris');
  });

  it("falls back to the device's own zone when there is no house default", () => {
    expect(
      resolveEffectiveTimezone({
        employeeTimezone: '',
        defaultTimezone: '',
        deviceTimezone: 'America/New_York',
      }),
    ).toBe('America/New_York');
  });

  it('falls back to UTC when nothing is set', () => {
    expect(resolveEffectiveTimezone({})).toBe(FALLBACK_TIMEZONE);
  });

  it('skips a candidate that is not a resolvable zone', () => {
    // The device zone is client-supplied and never validated on the way in: a machine
    // reporting nonsense must not poison every timestamp the employee sees.
    expect(
      resolveEffectiveTimezone({ employeeTimezone: '', defaultTimezone: '', deviceTimezone: 'XX' }),
    ).toBe(FALLBACK_TIMEZONE);
  });
});

describe('trackerSetTimezone', () => {
  it("records the caller's own zone", async () => {
    const user = await grantedEmployee();

    const access = await trackerDeviceService.setTimezone(user.id, 'Asia/Kolkata');

    expect(access.timezone).toBe('Asia/Kolkata');
    const stored = await TrackerAccessModel.findOne({ userId: user.id }).lean();
    expect(stored?.timezone).toBe('Asia/Kolkata');
  });

  it('rejects a zone the platform cannot resolve, and writes nothing', async () => {
    const user = await grantedEmployee();

    await expect(trackerDeviceService.setTimezone(user.id, 'Not/AZone')).rejects.toThrow(
      /Unknown timezone/i,
    );

    const stored = await TrackerAccessModel.findOne({ userId: user.id }).lean();
    expect(stored?.timezone).toBe('');
  });

  it('refuses once tracker access is revoked', async () => {
    const user = await grantedEmployee();
    await trackerAdminService.revokeAccess(user.id, 'admin');

    await expect(trackerDeviceService.setTimezone(user.id, 'UTC')).rejects.toThrow(/revoked/i);
  });
});

describe('trackerMe timezone (the effective zone the app runs on)', () => {
  it("uses the employee's pick over the house default", async () => {
    const user = await grantedEmployee('America/New_York');
    await updateTrackerSettings({ defaultTimezone: 'Europe/Paris' });
    await trackerDeviceService.setTimezone(user.id, 'Asia/Kolkata');

    await expect(trackerDeviceService.me(user.id, DEVICE_ID)).resolves.toMatchObject({
      timezone: 'Asia/Kolkata',
    });
  });

  it('uses the house default when the employee never picked one', async () => {
    const user = await grantedEmployee('America/New_York');
    await updateTrackerSettings({ defaultTimezone: 'Europe/Paris' });

    await expect(trackerDeviceService.me(user.id, DEVICE_ID)).resolves.toMatchObject({
      timezone: 'Europe/Paris',
    });
  });

  it("uses this device's own zone when there is no house default", async () => {
    const user = await grantedEmployee('America/New_York');

    await expect(trackerDeviceService.me(user.id, DEVICE_ID)).resolves.toMatchObject({
      timezone: 'America/New_York',
    });
  });

  it('falls back to UTC when the device reported no zone either', async () => {
    const user = await grantedEmployee();

    await expect(trackerDeviceService.me(user.id, DEVICE_ID)).resolves.toMatchObject({
      timezone: FALLBACK_TIMEZONE,
    });
  });
});

describe('TrackerAccess.timezone on grants that predate the field', () => {
  it('reads back as an empty string, not null', async () => {
    // Inserted through the raw collection so Mongoose schema defaults are bypassed —
    // exactly how a grant written before `timezone` existed looks on disk. Without the
    // merge, the non-nullable TrackerAccess.timezone would fail with "Cannot return null".
    await TrackerAccessModel.collection.insertOne({
      userId: 'legacy-user',
      grantedBy: 'admin',
      grantedAt: new Date(),
      revokedAt: null,
      revokedBy: '',
      isActive: true,
      consentedAt: null,
    });

    const [access] = await trackerAdminService.listAccess();

    expect(access.timezone).toBe('');
  });
});
