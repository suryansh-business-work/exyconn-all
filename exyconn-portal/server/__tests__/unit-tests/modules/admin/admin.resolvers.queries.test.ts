import { Types } from 'mongoose';
import { adminResolvers } from '../../../../src/modules/admin/admin.resolvers';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { seedOrganization } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = adminResolvers.Query as unknown as Record<string, Resolver>;

const ctx = (roles: Role[]) =>
  ({
    user: { id: new Types.ObjectId().toHexString(), email: 'caller@exyconn.com', roles },
  }) as unknown as GraphQLContext;

const passHolder = (key: 'clientContact' | 'demoVisitor', organizationId: string) =>
  ({
    user: null,
    [key]: { id: 'p1', name: 'Pat', email: 'pat@client.com', organizationId },
  }) as unknown as GraphQLContext;

async function person(name: string, roles: Role[] = [ROLES.EMPLOYEE]) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: 'x',
    roles,
  });
  return String(user._id);
}

describe('reading the user database', () => {
  it('lets HR list everybody, each with a GraphQL id', async () => {
    const asha = await person('Asha');

    const rows = (await Q.listUsers(null, {}, ctx([ROLES.HR]))) as Array<{ id: string }>;

    expect(rows.map((row) => row.id)).toEqual([asha]);
  });

  it('refuses a plain employee every read of the HR record', async () => {
    const employee = ctx([ROLES.EMPLOYEE]);
    const id = await person('Asha');

    await expect(Q.listUsers(null, {}, employee)).rejects.toThrow();
    await expect(
      Q.listUsersPaged(null, { input: { page: 0, pageSize: 5 } }, employee),
    ).rejects.toThrow();
    await expect(Q.listUsersStats(null, {}, employee)).rejects.toThrow();
    await expect(Q.getUser(null, { id }, employee)).rejects.toThrow();
  });

  it('pages the grid with ids and a total', async () => {
    await person('Asha');
    await person('Ravi');

    const page = (await Q.listUsersPaged(
      null,
      { input: { page: 0, pageSize: 1, sort: { field: 'name', dir: 'ASC' } } },
      ctx([ROLES.HR]),
    )) as { rows: Array<{ id: string; name: string }>; totalCount: number };

    expect(page.totalCount).toBe(2);
    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]).toMatchObject({ name: 'Asha', id: expect.any(String) });
  });

  it('counts users per role for the dashboard', async () => {
    await person('Asha');
    await person('Boss', [ROLES.ADMIN]);

    const stats = (await Q.listUsersStats(null, {}, ctx([ROLES.ADMIN]))) as { total: number };

    expect(stats.total).toBe(2);
  });

  it('gets one user by id', async () => {
    const id = await person('Asha');

    const user = (await Q.getUser(null, { id }, ctx([ROLES.HR]))) as { id: string; name: string };

    expect(user).toMatchObject({ id, name: 'Asha' });
  });
});

describe('appSettings', () => {
  it('lets a client hub contact read their own company’s formats without signing in', async () => {
    const organization = await seedOrganization('Client Co');

    const settings = (await Q.appSettings(
      null,
      {},
      passHolder('clientContact', String(organization._id)),
    )) as { id: string; currency: string };

    expect(settings.currency).toBe('USD');
    expect(settings.id).toEqual(expect.any(String));
  });

  it('lets a demo visitor read the demo company’s formats', async () => {
    const organization = await seedOrganization('Demo Co');

    const settings = (await Q.appSettings(
      null,
      {},
      passHolder('demoVisitor', String(organization._id)),
    )) as { currency: string };

    expect(settings.currency).toBe('USD');
  });

  it('reads the signed-in user’s own scope even when they also hold a pass', async () => {
    const organization = await seedOrganization('Client Co');
    const both = {
      ...ctx([ROLES.EMPLOYEE]),
      clientContact: { organizationId: String(organization._id) },
    } as unknown as GraphQLContext;

    const settings = (await Q.appSettings(null, {}, both)) as Record<string, unknown>;

    expect(settings).not.toHaveProperty('currency');
    expect(settings.timezone).toEqual(expect.any(String));
  });

  it('refuses an anonymous caller with no pass', async () => {
    await expect(Q.appSettings(null, {}, { user: null })).rejects.toThrow(
      'Authentication required',
    );
  });
});
