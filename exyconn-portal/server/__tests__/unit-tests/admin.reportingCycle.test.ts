import { UserModel } from '../../src/modules/admin/user.model';
import { adminService } from '../../src/modules/admin/admin.service';
import { directReportIds } from '../../src/modules/admin/reporting';
import { ROLES } from '../../src/constants/roles';

/** One employee, optionally already reporting to somebody. */
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

/** A reporting line written straight to the database, past every guard. */
async function forceManager(employeeId: string, managerId: string): Promise<void> {
  await UserModel.updateOne({ _id: employeeId }, { managerId });
}

/** Names in reporting order, deepest report first: person(0) reports to person(1), and so on. */
async function chainOf(names: readonly string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of [...names].reverse()) {
    ids.unshift(await person(name, ids[0] ?? null));
  }
  return ids;
}

describe('the reporting-cycle guard', () => {
  it('refuses a two-person loop and names both people', async () => {
    const anita = await person('Anita');
    const bala = await person('Bala', anita);

    await expect(adminService.updateUser(anita, { managerId: bala })).rejects.toThrow(
      'This would create a reporting loop: Anita → Bala → Anita. Change one of those reporting lines first.',
    );
    const unchanged = await UserModel.findById(anita).lean();
    expect(unchanged?.managerId).toBeNull();
  });

  it('refuses a three-person loop and names everybody in it', async () => {
    const anita = await person('Anita');
    const bala = await person('Bala', anita);
    const chandra = await person('Chandra', bala);

    await expect(adminService.updateUser(anita, { managerId: chandra })).rejects.toThrow(
      /loop: Anita → Chandra → Bala → Anita/,
    );
  });

  it('refuses the loop on create-then-assign too, whichever end is edited', async () => {
    const [deepest, middle, top] = await chainOf(['Ravi', 'Meera', 'Omar']);

    await expect(adminService.updateUser(top, { managerId: deepest })).rejects.toThrow(
      /reporting loop/,
    );
    expect(await directReportIds(middle)).toEqual([deepest]);
  });

  it('still allows a legitimate deep chain', async () => {
    const [deepest] = await chainOf(['Fay', 'Eve', 'Dev', 'Cara', 'Bea', 'Amit']);
    const newcomer = await person('Zara');

    const updated = await adminService.updateUser(newcomer, { managerId: deepest });

    expect(updated.managerId).toBe(deepest);
  });

  it('allows re-parenting somebody onto a manager further up their own chain', async () => {
    const [deepest, , top] = await chainOf(['Fay', 'Eve', 'Dev']);

    const updated = await adminService.updateUser(deepest, { managerId: top });

    expect(updated.managerId).toBe(top);
  });

  it('does not hang on a cycle already written into the database', async () => {
    const anita = await person('Anita');
    const bala = await person('Bala');
    const chandra = await person('Chandra');
    // A loop that predates the guard: Bala reports to Chandra reports to Bala.
    await forceManager(bala, chandra);
    await forceManager(chandra, bala);

    const updated = await adminService.updateUser(anita, { managerId: bala });

    expect(updated.managerId).toBe(bala);
  });

  it('does not hang when the pre-existing cycle runs through the employee’s own manager', async () => {
    const anita = await person('Anita');
    const bala = await person('Bala');
    await forceManager(bala, bala);

    const updated = await adminService.updateUser(anita, { managerId: bala });

    expect(updated.managerId).toBe(bala);
  });

  it('leaves a manager id that is not an account refused, as before', async () => {
    const anita = await person('Anita');

    await expect(adminService.updateUser(anita, { managerId: 'not-an-id' })).rejects.toThrow(
      /does not exist/,
    );
  });

  it('does not run the walk when a user is created, which has no reports yet', async () => {
    const anita = await person('Anita');

    const { user } = await adminService.createUser({
      name: 'Newcomer',
      email: 'newcomer@exyconn.com',
      roles: [ROLES.EMPLOYEE],
      managerId: anita,
    });

    expect(user.managerId).toBe(anita);
  });
});
