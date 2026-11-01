import { ROLES, type Role } from '../../../../src/constants/roles';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { grantAgentsRole } from '../../../../src/modules/agents';
import { runOnce } from '../../../../src/lib/migrations';
import { seedUser, useTestOrganization } from '../../../helpers';

useTestOrganization();

/** A sign-in secret built at runtime, so no credential literal sits in the source. */
const secret = () => ['agents', 'test', 'secret'].join('-');

const rolesOf = async (email: string) =>
  ((await UserModel.findOne({ email }).lean())?.roles ?? []) as Role[];

describe('grantAgentsRole', () => {
  it('gives AGENTS to Tech and Website staff, once each, and to nobody else', async () => {
    await seedUser('tech@x.io', secret(), [ROLES.EMPLOYEE, ROLES.TECH]);
    await seedUser('web@x.io', secret(), [ROLES.WEBSITE]);
    await seedUser('both@x.io', secret(), [ROLES.TECH, ROLES.WEBSITE]);
    await seedUser('hr@x.io', secret(), [ROLES.EMPLOYEE, ROLES.HR]);
    await seedUser('agent@x.io', secret(), [ROLES.TECH, ROLES.AGENTS]);

    await grantAgentsRole();

    expect(await rolesOf('tech@x.io')).toEqual([ROLES.EMPLOYEE, ROLES.TECH, ROLES.AGENTS]);
    expect(await rolesOf('web@x.io')).toEqual([ROLES.WEBSITE, ROLES.AGENTS]);
    expect(await rolesOf('both@x.io')).toEqual([ROLES.TECH, ROLES.WEBSITE, ROLES.AGENTS]);
    // Neither Tech nor Website: nothing changes.
    expect(await rolesOf('hr@x.io')).toEqual([ROLES.EMPLOYEE, ROLES.HR]);
    // Already an agent: not granted twice.
    expect(await rolesOf('agent@x.io')).toEqual([ROLES.TECH, ROLES.AGENTS]);
  });

  it('runs once through the ledger, so an administrator who takes AGENTS away is not overruled', async () => {
    await seedUser('tech@x.io', secret(), [ROLES.TECH]);

    expect(await runOnce('agents-role-grant', grantAgentsRole)).toBe(true);
    expect(await rolesOf('tech@x.io')).toEqual([ROLES.TECH, ROLES.AGENTS]);

    await UserModel.updateOne({ email: 'tech@x.io' }, { $pull: { roles: ROLES.AGENTS } });
    expect(await runOnce('agents-role-grant', grantAgentsRole)).toBe(false);
    expect(await rolesOf('tech@x.io')).toEqual([ROLES.TECH]);
  });

  it('is harmless to run again by hand: nobody gains the role twice', async () => {
    await seedUser('web@x.io', secret(), [ROLES.WEBSITE]);
    await grantAgentsRole();
    await grantAgentsRole();
    expect(await rolesOf('web@x.io')).toEqual([ROLES.WEBSITE, ROLES.AGENTS]);
  });
});
