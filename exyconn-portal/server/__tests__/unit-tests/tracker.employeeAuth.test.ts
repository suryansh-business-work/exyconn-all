import { UserModel } from '../../src/modules/admin/user.model';
import { hashPassword } from '../../src/utils/password';
import { ROLES } from '../../src/constants/roles';
import { verifyToken } from '../../src/utils/jwt';
import { assertEmployee } from '../../src/modules/tracker/tracker.auth';
import { trackerAdminService } from '../../src/modules/tracker/tracker.admin.service';
import { trackerDeviceService } from '../../src/modules/tracker/tracker.device.service';
import { TrackerAccessModel, TrackerDeviceModel } from '../../src/modules/tracker/models';

// The mailer talks to SMTP; stub the access-granted email so grants work offline.
jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendTrackerAccessEmail: jest.fn().mockResolvedValue(undefined) },
}));

const PASSWORD = process.env.TEST_TRACKER_PASSWORD ?? 'Tracked@123';
const DEVICE = { deviceId: 'device-1', platform: 'win32', hostname: 'PC', appVersion: '1.0.0' };

/** An employee with tracker access, signed in on a device — what the desktop app holds. */
async function signedInOnADevice() {
  const passwordHash = await hashPassword(PASSWORD);
  const user = await UserModel.create({
    name: 'Emp',
    email: 'emp@exyconn.com',
    passwordHash,
    roles: [ROLES.EMPLOYEE],
  });
  await trackerAdminService.grantAccess(user.id, 'admin');
  const { token } = await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);
  return { user, ctx: { user: verifyToken(token) } };
}

describe('the employee behind an off-computer time claim', () => {
  beforeEach(async () => {
    await Promise.all([
      UserModel.deleteMany({}),
      TrackerAccessModel.deleteMany({}),
      TrackerDeviceModel.deleteMany({}),
    ]);
  });

  it('is resolved from a device token, so the claim can be filed from the app', async () => {
    const { user, ctx } = await signedInOnADevice();

    await expect(assertEmployee(ctx)).resolves.toEqual({ id: user.id });
  });

  it('is refused once the device is revoked', async () => {
    const { ctx } = await signedInOnADevice();
    await TrackerDeviceModel.updateOne({ deviceId: DEVICE.deviceId }, { isActive: false });

    // A device token never expires, so this check is the only thing standing between a
    // lost laptop and a claim filed in somebody else's name.
    await expect(assertEmployee(ctx)).rejects.toThrow(/revoked/i);
  });

  it('is refused once tracker access is revoked', async () => {
    const { user, ctx } = await signedInOnADevice();
    await trackerAdminService.revokeAccess(user.id, 'admin');

    await expect(assertEmployee(ctx)).rejects.toThrow(/revoked/i);
  });

  it('refuses a caller with no token at all', async () => {
    await expect(assertEmployee({ user: null })).rejects.toThrow();
  });
});
