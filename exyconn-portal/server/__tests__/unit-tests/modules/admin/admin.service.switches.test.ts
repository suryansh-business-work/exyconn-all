import { Types } from 'mongoose';
import { adminService } from '../../../../src/modules/admin/admin.service';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ROLES } from '../../../../src/constants/roles';

const missingId = () => new Types.ObjectId().toHexString();

async function stored(name: string, email: string) {
  const user = await UserModel.create({ name, email, passwordHash: 'x', roles: [ROLES.EMPLOYEE] });
  return String(user._id);
}

describe('account switches', () => {
  it('deletes a user and reports one that is already gone', async () => {
    const id = await stored('Asha', 'asha@exyconn.com');

    await expect(adminService.deleteUser(id)).resolves.toBe(true);
    expect(await UserModel.exists({ _id: id })).toBeNull();
    await expect(adminService.deleteUser(id)).rejects.toThrow('User not found');
  });

  it('activates and deactivates', async () => {
    const id = await stored('Asha', 'asha@exyconn.com');

    expect((await adminService.setUserActive(id, false)).isActive).toBe(false);
    expect((await adminService.setUserActive(id, true)).isActive).toBe(true);
    await expect(adminService.setUserActive(missingId(), true)).rejects.toThrow('User not found');
  });

  it('blocks with or without a reason, and unblocking clears the reason', async () => {
    const id = await stored('Asha', 'asha@exyconn.com');

    expect(await adminService.setUserBlocked(id, true, 'Lost laptop')).toMatchObject({
      isBlocked: true,
      blockReason: 'Lost laptop',
    });
    expect((await adminService.setUserBlocked(id, true)).blockReason).toBeNull();
    await adminService.setUserBlocked(id, true, 'Again');
    expect(await adminService.setUserBlocked(id, false, 'ignored')).toMatchObject({
      isBlocked: false,
      blockReason: null,
    });
    await expect(adminService.setUserBlocked(missingId(), true)).rejects.toThrow('User not found');
  });
});
