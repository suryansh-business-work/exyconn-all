import { adminResolvers } from '../../src/modules/admin/admin.resolvers';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import { UserModel } from '../../src/modules/admin/user.model';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const listEmployeeOptions = adminResolvers.Query.listEmployeeOptions as Resolver;
const listUsers = adminResolvers.Query.listUsers as Resolver;
const appSettings = adminResolvers.Query.appSettings as Resolver;

const trackerCtx = {
  user: { id: '65b000000000000000000001', email: 'tracker@exyconn.com', roles: [ROLES.TRACKER] },
} as unknown as GraphQLContext;

describe('listEmployeeOptions', () => {
  it('is readable by a TRACKER-only user, unlike listUsers', async () => {
    await seedUser('zed@exyconn.com', 'whatever123', [ROLES.EMPLOYEE]);
    await seedUser('amy@exyconn.com', 'whatever123', [ROLES.FINANCE]);

    await expect(listUsers(null, {}, trackerCtx)).rejects.toThrow();

    const rows = (await listEmployeeOptions(null, {}, trackerCtx)) as Array<
      Record<string, unknown>
    >;
    expect(rows.map((row) => row.email)).toEqual(['amy@exyconn.com', 'zed@exyconn.com']);
  });

  it('exposes only id, name and email — never roles or the password hash', async () => {
    await seedUser('amy@exyconn.com', 'whatever123', [ROLES.FINANCE]);

    const [row] = (await listEmployeeOptions(null, {}, trackerCtx)) as Array<
      Record<string, unknown>
    >;
    expect(row.id).toEqual(expect.any(String));
    expect(row.name).toBe('amy');
    expect(row.email).toBe('amy@exyconn.com');
    expect(row).not.toHaveProperty('roles');
    expect(row).not.toHaveProperty('passwordHash');
  });

  it('leaves deactivated accounts out of the picker', async () => {
    const gone = await seedUser('gone@exyconn.com', 'whatever123', [ROLES.EMPLOYEE]);
    await UserModel.updateOne({ _id: gone.id }, { isActive: false });
    await seedUser('here@exyconn.com', 'whatever123', [ROLES.EMPLOYEE]);

    const rows = (await listEmployeeOptions(null, {}, trackerCtx)) as Array<{ email: string }>;
    expect(rows.map((row) => row.email)).toEqual(['here@exyconn.com']);
  });

  it('lets the same TRACKER-only user read the formatting settings', async () => {
    const settings = (await appSettings(null, {}, trackerCtx)) as { timezone: string };
    expect(settings.timezone).toEqual(expect.any(String));
  });

  it('rejects an unauthenticated caller', async () => {
    await expect(listEmployeeOptions(null, {}, {} as GraphQLContext)).rejects.toThrow();
  });
});
