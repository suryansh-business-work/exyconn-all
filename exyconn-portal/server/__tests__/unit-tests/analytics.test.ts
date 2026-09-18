import { Types } from 'mongoose';
import { UserModel } from '../../src/modules/admin/user.model';
import { OrganizationModel } from '../../src/modules/organizations';
import {
  TrackerAccessModel,
  TrackerDeviceModel,
  TrackerSessionModel,
  TrackerWindowUsageModel,
} from '../../src/modules/tracker/models';
import { analyticsResolvers } from '../../src/modules/analytics';
import { dayKeys, fillTrend, toMetrics } from '../../src/modules/analytics/analytics.metrics';
import { runAsPlatform, runForOrganization } from '../../src/lib/tenant';
import { ROLES, type Role } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';
import { useTestOrganization } from '../helpers';

const ORGANIZATION = useTestOrganization();

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = analyticsResolvers.Query as unknown as Record<string, Resolver>;

const ctx = (roles: Role[]) =>
  ({
    user: { id: new Types.ObjectId().toHexString(), email: 'a@exyconn.com', roles },
    organizationId: ORGANIZATION,
  }) as unknown as GraphQLContext;

const HOUR = 3_600_000;

function person(roles: Role[], over: Record<string, unknown> = {}) {
  return UserModel.create({
    name: `P-${new Types.ObjectId().toHexString()}`,
    email: `${new Types.ObjectId().toHexString()}@exyconn.com`,
    passwordHash: 'x',
    roles,
    ...over,
  });
}

function session(userId: string, activeHours: number, idleHours = 0) {
  return TrackerSessionModel.create({
    userId,
    deviceId: 'd1',
    startedAt: new Date(),
    activeMs: activeHours * HOUR,
    idleMs: idleHours * HOUR,
  });
}

interface Workspace {
  users: Record<string, unknown> & { byRole: { label: string; value: number }[] };
  employees: Record<string, unknown>;
  tracker: Record<string, unknown> & { hoursPerDay: { value: number }[] };
}

const workspace = async (days = 30) =>
  (await Q.workspaceAnalytics(null, { days }, ctx([ROLES.ADMIN]))) as Workspace;

describe('analytics helpers', () => {
  it('labels an empty group and puts the largest first', () => {
    expect(
      toMetrics([
        { _id: 'HR', value: 1 },
        { _id: null, value: 3 },
        { _id: 'Tech', value: 2 },
      ]),
    ).toEqual([
      { label: 'Not set', value: 3 },
      { label: 'Tech', value: 2 },
      { label: 'HR', value: 1 },
    ]);
  });

  it('lays rows over every day so a quiet one reads as zero', () => {
    const keys = dayKeys(3, 'UTC', Date.UTC(2026, 8, 18, 12));
    expect(keys).toEqual(['2026-09-16', '2026-09-17', '2026-09-18']);
    expect(fillTrend(keys, [{ _id: '2026-09-17', value: 4 }]).map((p) => p.value)).toEqual([
      0, 4, 0,
    ]);
  });
});

describe('workspaceAnalytics', () => {
  it('counts users, their roles and who is online', async () => {
    await person([ROLES.ADMIN, ROLES.EMPLOYEE], { lastActiveAt: new Date() });
    await person([ROLES.EMPLOYEE], { isActive: false });
    await person([ROLES.HR], { isBlocked: true });

    const { users } = await workspace();

    expect(users).toMatchObject({
      total: 3,
      active: 2,
      inactive: 1,
      blocked: 1,
      onlineNow: 1,
      joined: 3,
    });
    expect(users.byRole).toEqual([
      { label: 'EMPLOYEE', value: 2 },
      { label: 'ADMIN', value: 1 },
      { label: 'HR', value: 1 },
    ]);
  });

  it('breaks employees down by status, department, location and country', async () => {
    await person([ROLES.EMPLOYEE], { department: 'Tech', country: 'IN' });
    await person([ROLES.EMPLOYEE], { department: 'Tech' });
    await person([ROLES.HR], { department: 'People' });

    const { employees } = await workspace();

    expect(employees).toMatchObject({
      total: 2,
      byDepartment: [{ label: 'Tech', value: 2 }],
      byStatus: [{ label: 'ACTIVE', value: 2 }],
      byWorkLocation: [{ label: 'OFFICE', value: 2 }],
      byCountry: [
        { label: 'IN', value: 1 },
        { label: 'Not set', value: 1 },
      ],
    });
  });

  it('sums tracked hours, activity, top people and apps', async () => {
    const asha = await person([ROLES.EMPLOYEE], { name: 'Asha' });
    const ravi = await person([ROLES.EMPLOYEE], { name: 'Ravi' });
    await session(String(asha._id), 6, 2);
    await session(String(ravi._id), 2);
    await TrackerAccessModel.create({ userId: String(asha._id), grantedBy: 'x' });
    await TrackerDeviceModel.create({
      userId: String(asha._id),
      deviceId: 'd1',
      tokenHash: 'h',
      platform: 'darwin',
    });
    await TrackerWindowUsageModel.create({
      userId: String(asha._id),
      sessionId: 's1',
      intervalStartedAt: new Date(),
      appName: 'Code',
      durationMs: 3 * HOUR,
    });

    const { tracker } = await workspace(7);

    expect(tracker).toMatchObject({
      usersWithAccess: 1,
      consented: 0,
      activeDevices: 1,
      sessions: 2,
      trackedUsers: 2,
      activeHours: 8,
      idleHours: 2,
      activityPercent: 80,
      topUsers: [
        { label: 'Asha', value: 6 },
        { label: 'Ravi', value: 2 },
      ],
      topApps: [{ label: 'Code', value: 3 }],
      devicesByPlatform: [{ label: 'darwin', value: 1 }],
    });
    expect(tracker.hoursPerDay).toHaveLength(7);
    expect(tracker.hoursPerDay.at(-1)?.value).toBe(8);
  });

  it("never counts another company's people", async () => {
    await person([ROLES.EMPLOYEE]);
    await runForOrganization(new Types.ObjectId().toHexString(), () => person([ROLES.EMPLOYEE]));

    const { users } = await workspace();

    expect(users.total).toBe(1);
  });

  it('is for admins only, over a sensible period', async () => {
    await expect(Q.workspaceAnalytics(null, { days: 30 }, ctx([ROLES.HR]))).rejects.toThrow();
    await expect(workspace(0)).rejects.toThrow('between 1 and 365 days');
  });
});

describe('platformAnalytics', () => {
  it('counts organizations and users across the platform', async () => {
    const other = await runAsPlatform(() =>
      OrganizationModel.create({
        name: 'Other Co',
        slug: 'other-co',
        currency: 'EUR',
        country: 'DE',
        status: 'SUSPENDED',
      }),
    );
    await person([ROLES.EMPLOYEE]);
    await runForOrganization(String(other._id), async () => {
      await person([ROLES.EMPLOYEE]);
      await person([ROLES.HR]);
    });

    const platform = (await Q.platformAnalytics(null, {}, ctx([ROLES.SUPER_ADMIN]))) as Record<
      string,
      unknown
    > & { organizationsPerMonth: { value: number }[] };

    expect(platform).toMatchObject({
      organizations: 2,
      activeOrganizations: 1,
      users: 3,
      employees: 2,
      organizationsByStatus: [
        { label: 'ACTIVE', value: 1 },
        { label: 'SUSPENDED', value: 1 },
      ],
      usersByOrganization: [
        { label: 'Other Co', value: 2 },
        { label: 'Test Co', value: 1 },
      ],
    });
    expect(platform.organizationsPerMonth).toHaveLength(12);
    expect(platform.organizationsPerMonth.at(-1)?.value).toBe(2);
  });

  it("is refused to a company's own admin", async () => {
    await expect(Q.platformAnalytics(null, {}, ctx([ROLES.ADMIN]))).rejects.toThrow();
  });
});
