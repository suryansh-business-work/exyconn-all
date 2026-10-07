import { Types } from 'mongoose';
import { adminResolvers } from '../../../../src/modules/admin/admin.resolvers';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { mailer } from '../../../../src/utils/mailer';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const M = adminResolvers.Mutation as unknown as Record<string, Resolver>;

const customMail = jest.fn().mockResolvedValue(undefined);
mailer.sendCustomEmail = customMail;

const ctx = (roles: Role[]) =>
  ({
    user: { id: new Types.ObjectId().toHexString(), email: 'caller@exyconn.com', roles },
  }) as unknown as GraphQLContext;
const asAdmin = ctx([ROLES.ADMIN]);
const asHr = ctx([ROLES.HR]);

async function person(roles: Role[] = [ROLES.EMPLOYEE]) {
  const user = await UserModel.create({
    name: 'Asha',
    email: 'asha@exyconn.com',
    passwordHash: 'x',
    roles,
  });
  return String(user._id);
}

const summaries = async () =>
  (await AuditLogModel.find().sort({ createdAt: 1, _id: 1 }).lean()).map((row) => row.summary);

describe('setUserActive', () => {
  it('deactivates and reactivates, saying which in the audit', async () => {
    const id = await person();

    const off = (await M.setUserActive(null, { id, isActive: false }, asAdmin)) as {
      id: string;
      isActive: boolean;
    };
    await M.setUserActive(null, { id, isActive: true }, asAdmin);

    expect(off).toMatchObject({ id, isActive: false });
    expect(await summaries()).toEqual(['Deactivated user Asha', 'Activated user Asha']);
  });

  it('is refused to HR and on a platform administrator’s account', async () => {
    const id = await person();
    const root = await UserModel.create({
      name: 'Root',
      email: 'root@exyconn.com',
      passwordHash: 'x',
      roles: [ROLES.SUPER_ADMIN],
    });

    await expect(M.setUserActive(null, { id, isActive: false }, asHr)).rejects.toThrow();
    await expect(
      M.setUserActive(null, { id: String(root._id), isActive: false }, asAdmin),
    ).rejects.toThrow(/platform administrator/);
  });
});

describe('setUserBlocked', () => {
  it('audits a block with a reason, without one, and an unblock', async () => {
    const id = await person();

    await M.setUserBlocked(null, { id, isBlocked: true, reason: 'Lost laptop' }, asAdmin);
    await M.setUserBlocked(null, { id, isBlocked: true }, asAdmin);
    const unblocked = (await M.setUserBlocked(null, { id, isBlocked: false }, asAdmin)) as {
      isBlocked: boolean;
    };

    expect(unblocked.isBlocked).toBe(false);
    expect(await summaries()).toEqual([
      'Blocked user Asha: Lost laptop',
      'Blocked user Asha',
      'Unblocked user Asha',
    ]);
  });

  it('is refused to HR', async () => {
    const id = await person();

    await expect(M.setUserBlocked(null, { id, isBlocked: true }, asHr)).rejects.toThrow();
    expect((await UserModel.findById(id).lean())?.isBlocked).toBe(false);
  });
});

describe('resetUserPassword', () => {
  it('returns the temporary password and audits who it was issued for', async () => {
    const id = await person();

    const password = await M.resetUserPassword(null, { id }, asAdmin);

    expect(password).toEqual(expect.any(String));
    expect(await AuditLogModel.findOne().lean()).toMatchObject({
      action: 'PASSWORD_RESET',
      entityId: id,
      entityLabel: 'asha@exyconn.com',
      summary: 'Issued a temporary password for Asha',
    });
  });

  it('is refused to HR', async () => {
    const id = await person();

    await expect(M.resetUserPassword(null, { id }, asHr)).rejects.toThrow();
  });
});

describe('sendUserMail', () => {
  it('sends the composed email for an administrator', async () => {
    const id = await person();
    const input = { subject: 'Hello', message: 'Welcome aboard' };

    await expect(M.sendUserMail(null, { id, input }, asAdmin)).resolves.toBe(true);

    expect(customMail).toHaveBeenCalledWith(expect.objectContaining(input));
  });

  it('is refused to HR', async () => {
    const id = await person();

    await expect(
      M.sendUserMail(null, { id, input: { subject: 's', message: 'm' } }, asHr),
    ).rejects.toThrow();
    expect(customMail).not.toHaveBeenCalled();
  });
});

describe('updateSettings', () => {
  it('saves the settings and audits what changed', async () => {
    const saved = (await M.updateSettings(
      null,
      { input: { timezone: 'Europe/London' } },
      asAdmin,
    )) as { id: string; timezone: string };

    expect(saved).toMatchObject({ id: expect.any(String), timezone: 'Europe/London' });
    const audit = await AuditLogModel.findOne().lean();
    expect(audit).toMatchObject({
      action: 'SETTINGS',
      module: 'AppSettings',
      entityId: saved.id,
      entityLabel: 'global',
      summary: 'Updated app settings',
    });
    expect(JSON.parse(audit?.changes ?? '{}')).toEqual({
      timezone: { from: 'Asia/Kolkata', to: 'Europe/London' },
    });
  });

  it('is for administrators only', async () => {
    await expect(M.updateSettings(null, { input: { timezone: 'UTC' } }, asHr)).rejects.toThrow();
  });
});
