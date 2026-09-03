import { NotificationModel } from '../../src/modules/notifications';
import { notificationsResolvers } from '../../src/modules/notifications';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const send = notificationsResolvers.Mutation.sendNotification as unknown as Resolver;
const hr = {
  user: { id: 'hr', email: 'hr@x.com', roles: [ROLES.HR] },
} as unknown as GraphQLContext;
const emp = {
  user: { id: 'e', email: 'e@x.com', roles: [ROLES.EMPLOYEE] },
} as unknown as GraphQLContext;
const base = { kind: 'GENERAL', title: 'Town hall', body: 'Friday 4pm', link: '/me/announcements' };

async function people() {
  const a = await seedUser('a@x.com', 'pw123456', [ROLES.EMPLOYEE]);
  const b = await seedUser('b@x.com', 'pw123456', [ROLES.EMPLOYEE]);
  const c = await seedUser('c@x.com', 'pw123456', [ROLES.EMPLOYEE]);
  await UserModel.updateOne({ _id: a._id }, { department: 'Engineering' });
  await UserModel.updateOne({ _id: b._id }, { department: 'Engineering' });
  await UserModel.updateOne({ _id: c._id }, { department: 'Sales', isActive: false });
  return { a: String(a._id), b: String(b._id), c: String(c._id) };
}

describe('sendNotification', () => {
  it('ALL reaches every active user and skips deactivated ones', async () => {
    const { c } = await people();
    const r = (await send(null, { input: { ...base, audience: 'ALL' } }, hr)) as {
      recipients: number;
    };
    expect(r.recipients).toBe(2);
    expect(await NotificationModel.countDocuments({ employeeId: c })).toBe(0);
  });

  it('DEPARTMENT reaches only that department', async () => {
    const { a, b } = await people();
    const r = (await send(
      null,
      { input: { ...base, audience: 'DEPARTMENT', department: 'Engineering' } },
      hr,
    )) as { recipients: number };
    expect(r.recipients).toBe(2);
    expect(await NotificationModel.countDocuments({ employeeId: { $in: [a, b] } })).toBe(2);
  });

  it('EMPLOYEES reaches exactly the chosen ids', async () => {
    const { a } = await people();
    const r = (await send(
      null,
      { input: { ...base, audience: 'EMPLOYEES', employeeIds: [a] } },
      hr,
    )) as { recipients: number };
    expect(r.recipients).toBe(1);
    expect((await NotificationModel.findOne({ employeeId: a }))?.title).toBe('Town hall');
  });

  it('rejects a DEPARTMENT audience without a department, and a plain employee sender', async () => {
    await people();
    await expect(send(null, { input: { ...base, audience: 'DEPARTMENT' } }, hr)).rejects.toThrow(
      /department/,
    );
    await expect(send(null, { input: { ...base, audience: 'ALL' } }, emp)).rejects.toThrow();
  });
});
