import { UserModel } from '../../src/modules/admin/user.model';
import { hashPassword } from '../../src/utils/password';
import { ROLES } from '../../src/constants/roles';
import { verifyToken } from '../../src/utils/jwt';
import { trackerAdminService } from '../../src/modules/tracker/tracker.admin.service';
import { trackerDeviceService } from '../../src/modules/tracker/tracker.device.service';
import { TrackerAccessModel, TrackerDeviceModel } from '../../src/modules/tracker/models';
import { hashToken } from '../../src/modules/tracker/tracker.auth';

jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendTrackerAccessEmail: jest.fn().mockResolvedValue(undefined) },
}));

const PASSWORD = process.env.TEST_TRACKER_PASSWORD ?? 'Tracked@12345';
const DEVICE = { deviceId: 'shared-1', platform: 'win32', hostname: 'PC', appVersion: '1.0.0' };
const REVOKED = /This device was revoked/;

async function employeeWithAccess(email: string) {
  const user = await UserModel.create({
    name: email.split('@')[0],
    email,
    passwordHash: await hashPassword(PASSWORD),
    roles: [ROLES.EMPLOYEE],
  });
  await trackerAdminService.grantAccess(user.id, 'admin');
  return user;
}

describe('enrolling a tracker device', () => {
  it('carries the token version in the device token', async () => {
    await employeeWithAccess('emp@exyconn.com');

    const { token } = await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);

    expect(verifyToken(token)).toMatchObject({ deviceId: 'shared-1', tv: 0 });
  });

  it('hands a shared machine over to the next employee and retires the previous token', async () => {
    await employeeWithAccess('first@exyconn.com');
    const second = await employeeWithAccess('second@exyconn.com');
    const first = await trackerDeviceService.login('first@exyconn.com', PASSWORD, DEVICE);

    await trackerDeviceService.login('second@exyconn.com', PASSWORD, DEVICE);

    const row = await TrackerDeviceModel.findOne({ deviceId: DEVICE.deviceId }).lean();
    expect(row?.userId).toBe(second.id);
    expect(row?.tokenHash).not.toBe(hashToken(first.token));
  });

  it('keeps a revoked device revoked, however often the password is typed', async () => {
    await employeeWithAccess('emp@exyconn.com');
    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);
    await trackerAdminService.revokeDevice(DEVICE.deviceId);

    await expect(trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE)).rejects.toThrow(
      REVOKED,
    );
  });

  it('re-enables every device once the administrator grants access again', async () => {
    const user = await employeeWithAccess('emp@exyconn.com');
    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);
    await trackerAdminService.revokeAccess(user.id, 'admin');
    await TrackerAccessModel.updateOne(
      { userId: user.id },
      { grantedAt: new Date(Date.now() - 60_000) },
    );
    await expect(trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE)).rejects.toThrow();

    await trackerAdminService.grantAccess(user.id, 'admin');

    await expect(
      trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE),
    ).resolves.toHaveProperty('token');
    const device = await TrackerDeviceModel.findOne({ deviceId: DEVICE.deviceId }).lean();
    expect(device).toMatchObject({ isActive: true, revokedAt: null });
  });
});
