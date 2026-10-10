import { UserModel } from '../../../../src/modules/admin/user.model';
import { hashPassword } from '../../../../src/utils/password';
import { ROLES } from '../../../../src/constants/roles';
import { verifyToken } from '../../../../src/utils/jwt';
import { trackerDeviceService } from '../../../../src/modules/tracker/tracker.device.service';
import { trackerAdminService } from '../../../../src/modules/tracker/tracker.admin.service';
import { TrackerDeviceModel } from '../../../../src/modules/tracker/models';

// The mailer talks to SMTP; stub the access-granted email so grants work offline.
jest.mock('../../../../src/utils/mailer', () => ({
  mailer: { sendTrackerAccessEmail: jest.fn().mockResolvedValue(undefined) },
}));

const PASSWORD = 'Tracked@123';

async function grantedEmployee() {
  const passwordHash = await hashPassword(PASSWORD);
  const user = await UserModel.create({
    name: 'Emp',
    email: 'emp@exyconn.com',
    passwordHash,
    roles: [ROLES.EMPLOYEE],
  });
  await trackerAdminService.grantAccess(user.id, 'admin');
  return user;
}

describe('signing a device in with the minimum it reports', () => {
  it('stores a device that sent no hostname with an empty one', async () => {
    await grantedEmployee();

    await trackerDeviceService.login('emp@exyconn.com', PASSWORD, {
      deviceId: 'bare-device',
      platform: 'win32',
    });

    const device = await TrackerDeviceModel.findOne({ deviceId: 'bare-device' }).lean();
    expect(device).toMatchObject({ platform: 'win32', hostname: '', appVersion: '' });
  });

  it('binds token version 0 for an account stored before token versions existed', async () => {
    const user = await grantedEmployee();
    await UserModel.updateOne({ _id: user._id }, { $unset: { tokenVersion: 1 } });

    const result = await trackerDeviceService.login('emp@exyconn.com', PASSWORD, {
      deviceId: 'legacy-account-device',
      platform: 'darwin',
    });

    expect(verifyToken(result.token)).toMatchObject({ id: user.id, tv: 0 });
  });
});
