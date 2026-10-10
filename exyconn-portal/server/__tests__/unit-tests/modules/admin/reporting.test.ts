import { Types } from 'mongoose';
import {
  assertMayActFor,
  directReportIds,
  isManagerOf,
  pendingOrRecent,
  reportingResolvers,
  teamScope,
} from '../../../../src/modules/admin/reporting';
import { UserModel } from '../../../../src/modules/admin/user.model';
import * as delegates from '../../../../src/modules/approvals/delegates.service';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = reportingResolvers.Query as unknown as Record<string, Resolver>;
const managerName = reportingResolvers.User.managerName;

const ctx = (id: string, roles: Role[] = [ROLES.EMPLOYEE]) =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;

async function person(name: string, managerId: string | null = null, isActive = true) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
    managerId,
    isActive,
  });
  return user._id.toHexString();
}

afterEach(() => jest.restoreAllMocks());

describe('the reporting line', () => {
  it('lists only the active direct reports', async () => {
    const meera = await person('Meera');
    const ravi = await person('Ravi', meera);
    await person('Gone', meera, false);

    expect(await directReportIds(meera)).toEqual([ravi]);
  });

  it('knows who manages whom, and treats a malformed id as nobody’s report', async () => {
    const meera = await person('Meera');
    const ravi = await person('Ravi', meera);

    expect(await isManagerOf(meera, ravi)).toBe(true);
    expect(await isManagerOf(ravi, meera)).toBe(false);
    expect(await isManagerOf(meera, 'not-an-id')).toBe(false);
  });
});

describe('assertMayActFor', () => {
  it('refuses an anonymous caller', async () => {
    await expect(assertMayActFor({ user: null }, 'x', [ROLES.HR])).rejects.toThrow(
      'Authentication required',
    );
  });

  it('admits ADMIN and the module’s own roles without asking about the line', async () => {
    const ravi = await person('Ravi');
    const admin = ctx(new Types.ObjectId().toHexString(), [ROLES.ADMIN]);
    const hr = ctx(new Types.ObjectId().toHexString(), [ROLES.HR]);

    await expect(assertMayActFor(admin, ravi, [ROLES.HR])).resolves.toBe(admin.user);
    await expect(assertMayActFor(hr, ravi, [ROLES.HR])).resolves.toBe(hr.user);
  });

  it('admits the employee’s own manager', async () => {
    const meera = await person('Meera');
    const ravi = await person('Ravi', meera);

    await expect(assertMayActFor(ctx(meera), ravi, [ROLES.HR])).resolves.toMatchObject({
      id: meera,
    });
  });

  it('admits whoever is covering the manager today', async () => {
    const meera = await person('Meera');
    const ravi = await person('Ravi', meera);
    const omar = await person('Omar');
    const covering = jest.spyOn(delegates, 'delegatedFromIds').mockResolvedValue([meera]);

    await expect(assertMayActFor(ctx(omar), ravi, [ROLES.HR])).resolves.toMatchObject({ id: omar });
    expect(covering).toHaveBeenCalledWith(omar);
  });

  it('refuses a stand-in for somebody who is not the employee’s manager', async () => {
    const meera = await person('Meera');
    const ravi = await person('Ravi', meera);
    const omar = await person('Omar');
    const other = await person('Other');
    jest.spyOn(delegates, 'delegatedFromIds').mockResolvedValue([other]);

    await expect(assertMayActFor(ctx(omar), ravi, [ROLES.HR])).rejects.toThrow(
      /Only HR, the employee.s manager or their stand-in may do this/,
    );
  });

  it('refuses a bystander covering nobody', async () => {
    const meera = await person('Meera');
    const ravi = await person('Ravi', meera);
    const omar = await person('Omar');

    await expect(assertMayActFor(ctx(omar), ravi, [ROLES.HR])).rejects.toThrow(/stand-in/);
  });

  it('refuses a caller whose token carries no roles at all', async () => {
    const ravi = await person('Ravi');
    const bare = {
      user: { id: new Types.ObjectId().toHexString(), email: 'b@exyconn.com' },
    } as unknown as GraphQLContext;

    await expect(assertMayActFor(bare, ravi, [ROLES.HR])).rejects.toThrow(/stand-in/);
  });
});

describe('team filters', () => {
  it('scopes rows to the team, and adds pending or recently decided ones', () => {
    const now = Date.UTC(2026, 9, 7, 12);
    jest.spyOn(Date, 'now').mockReturnValue(now);

    expect(teamScope(['a', 'b'])).toEqual({ employeeId: { $in: ['a', 'b'] } });
    expect(pendingOrRecent(['a'])).toEqual({
      employeeId: { $in: ['a'] },
      $or: [{ status: 'PENDING' }, { updatedAt: { $gte: new Date(now - 30 * 86_400_000) } }],
    });
  });
});

describe('User.managerName', () => {
  it('names the manager, and is null for none, a malformed id or a deleted account', async () => {
    const meera = await person('Meera');

    expect(await managerName({ managerId: meera })).toBe('Meera');
    expect(await managerName({})).toBeNull();
    expect(await managerName({ managerId: null })).toBeNull();
    expect(await managerName({ managerId: 'not-an-id' })).toBeNull();
    expect(await managerName({ managerId: new Types.ObjectId().toHexString() })).toBeNull();
  });
});

describe('myManager and orgChart', () => {
  it('returns null when the recorded manager no longer exists', async () => {
    const ravi = await person('Ravi', new Types.ObjectId().toHexString());

    expect(await Q.myManager(null, {}, ctx(ravi))).toBeNull();
  });

  it('lists the active organisation for HR, sorted by name', async () => {
    const zed = await person('Zed');
    await person('Amy', zed);
    await person('Gone', null, false);

    const rows = (await Q.orgChart(null, {}, ctx(zed, [ROLES.HR]))) as Array<{
      name: string;
      managerId: string | null;
      id: string;
    }>;

    expect(rows.map((row) => row.name)).toEqual(['Amy', 'Zed']);
    expect(rows[0]).toMatchObject({ managerId: zed, id: expect.any(String) });
    expect(rows[0]).not.toHaveProperty('email');
  });

  it('keeps the org chart from a plain employee', async () => {
    const ravi = await person('Ravi');

    await expect(Q.orgChart(null, {}, ctx(ravi))).rejects.toThrow();
  });
});
