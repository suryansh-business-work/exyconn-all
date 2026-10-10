import { Types } from 'mongoose';
import { adminResolvers } from '../../../../src/modules/admin/admin.resolvers';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const M = adminResolvers.Mutation as unknown as Record<string, Resolver>;

const ctx = (roles: Role[], id = new Types.ObjectId().toHexString()) =>
  ({ user: { id, email: 'caller@exyconn.com', roles } }) as unknown as GraphQLContext;
const asAdmin = ctx([ROLES.ADMIN]);
const asHr = ctx([ROLES.HR]);

async function person(name: string, roles: Role[] = [ROLES.EMPLOYEE]) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: 'x',
    roles,
  });
  return user._id.toHexString();
}

const lastAudit = async () => AuditLogModel.findOne().sort({ createdAt: -1, _id: -1 }).lean();

describe('createUser', () => {
  it('creates the account, hands back the password once and audits it', async () => {
    const result = (await M.createUser(
      null,
      {
        input: { name: 'Asha', email: 'asha@exyconn.com', roles: [ROLES.SUPPORT, ROLES.EMPLOYEE] },
      },
      asAdmin,
    )) as { user: { id: string; email: string }; password: string };

    expect(result.user).toMatchObject({ id: expect.any(String), email: 'asha@exyconn.com' });
    expect(result.password).toEqual(expect.any(String));
    expect(await lastAudit()).toMatchObject({
      action: 'CREATE',
      module: 'User',
      entityId: result.user.id,
      entityLabel: 'asha@exyconn.com',
      summary: 'Created user Asha (EMPLOYEE, SUPPORT)',
    });
  });

  it('refuses HR creating an administrator, before anything is written', async () => {
    await expect(
      M.createUser(
        null,
        { input: { name: 'Mallory', email: 'mallory@exyconn.com', roles: [ROLES.ADMIN] } },
        asHr,
      ),
    ).rejects.toThrow('Only an administrator can grant the ADMIN role.');
    expect(await UserModel.countDocuments()).toBe(0);
  });
});

describe('updateUser', () => {
  it('records a role change with both role lists', async () => {
    const id = await person('Asha');

    const updated = (await M.updateUser(
      null,
      { id, input: { roles: [ROLES.SUPPORT, ROLES.EMPLOYEE] } },
      asAdmin,
    )) as { id: string; roles: string[] };

    expect(updated.id).toBe(id);
    expect(await lastAudit()).toMatchObject({
      action: 'ROLE_CHANGE',
      summary: 'Changed roles of Asha from [EMPLOYEE] to [EMPLOYEE, SUPPORT]',
    });
  });

  it('records an ordinary edit, with what changed, when the roles only change order', async () => {
    const id = await person('Asha', [ROLES.EMPLOYEE, ROLES.SUPPORT]);

    await M.updateUser(
      null,
      { id, input: { roles: [ROLES.SUPPORT, ROLES.EMPLOYEE], department: 'Ops' } },
      asHr,
    );

    const audit = await lastAudit();
    expect(audit).toMatchObject({ action: 'UPDATE', summary: 'Updated user Asha' });
    expect(JSON.parse(audit?.changes ?? '{}')).toHaveProperty('department');
  });

  it('records an edit that does not send roles at all as an update', async () => {
    const id = await person('Asha');

    await M.updateUser(null, { id, input: { designation: 'Lead' } }, asAdmin);

    expect((await lastAudit())?.action).toBe('UPDATE');
  });

  it('refuses HR changing somebody’s email', async () => {
    const id = await person('Asha');

    await expect(
      M.updateUser(null, { id, input: { email: 'mine@exyconn.com' } }, asHr),
    ).rejects.toThrow(/Only an administrator can change a person/);
    expect((await UserModel.findById(id).lean())?.email).toBe('asha@exyconn.com');
  });

  it('refuses a company admin editing a platform administrator', async () => {
    const id = await person('Root', [ROLES.SUPER_ADMIN]);

    await expect(M.updateUser(null, { id, input: { name: 'Owned' } }, asAdmin)).rejects.toThrow(
      /Only a platform administrator can change/,
    );
  });

  it('lets the platform administrator edit another platform administrator', async () => {
    const id = await person('Root', [ROLES.SUPER_ADMIN]);
    const platform = ctx([ROLES.SUPER_ADMIN, ROLES.ADMIN]);

    const updated = (await M.updateUser(null, { id, input: { name: 'Root Two' } }, platform)) as {
      name: string;
    };

    expect(updated.name).toBe('Root Two');
  });
});

describe('deleteUser', () => {
  it('deletes and audits under the deleted person’s name', async () => {
    const id = await person('Asha');

    await expect(M.deleteUser(null, { id }, asAdmin)).resolves.toBe(true);

    expect(await lastAudit()).toMatchObject({
      action: 'DELETE',
      entityLabel: 'asha@exyconn.com',
      summary: 'Deleted user Asha',
    });
  });

  it('is for administrators only', async () => {
    const id = await person('Asha');

    await expect(M.deleteUser(null, { id }, asHr)).rejects.toThrow();
    expect(await UserModel.exists({ _id: id })).not.toBeNull();
  });

  it('reports a user that does not exist', async () => {
    await expect(
      M.deleteUser(null, { id: new Types.ObjectId().toHexString() }, asAdmin),
    ).rejects.toThrow('User not found');
  });
});
