import { Types } from 'mongoose';
import { adminService } from '../../../../src/modules/admin/admin.service';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ROLES } from '../../../../src/constants/roles';

/** One employee, optionally with a reporting line written straight to the database. */
async function person(name: string, managerId: string | null = null): Promise<string> {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
    managerId,
  });
  return String(user._id);
}

describe('the reporting-cycle walk on data written before the guard', () => {
  it('stops at a manager id that is not an account id', async () => {
    const anita = await person('Anita');
    const bala = await person('Bala', 'legacy-free-text');

    const updated = await adminService.updateUser(anita, { managerId: bala });

    expect(updated.managerId).toBe(bala);
  });

  it('stops at a manager whose account was deleted', async () => {
    const anita = await person('Anita');
    const bala = await person('Bala', new Types.ObjectId().toHexString());

    const updated = await adminService.updateUser(anita, { managerId: bala });

    expect(updated.managerId).toBe(bala);
  });

  it('names an employee it cannot find generically in the refusal', async () => {
    const ghost = new Types.ObjectId().toHexString();
    const bala = await person('Bala', ghost);

    await expect(adminService.updateUser(ghost, { managerId: bala })).rejects.toThrow(
      'This would create a reporting loop: This employee → Bala → This employee.',
    );
  });
});
