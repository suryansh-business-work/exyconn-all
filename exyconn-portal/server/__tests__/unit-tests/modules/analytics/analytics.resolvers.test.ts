import { Types } from 'mongoose';
import { analyticsResolvers, analyticsTypeDefs } from '../../../../src/modules/analytics';
import { AppSettingsModel } from '../../../../src/modules/admin/settings.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { TrackerSessionModel } from '../../../../src/modules/tracker/models';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = analyticsResolvers.Query as unknown as Record<string, Resolver>;

const ctx = (roles: Role[]) =>
  ({
    user: { id: new Types.ObjectId().toHexString(), email: 'a@exyconn.com', roles },
  }) as unknown as GraphQLContext;
const asAdmin = ctx([ROLES.ADMIN]);

interface Workspace {
  days: number;
  timezone: string;
  tracker: Record<string, unknown> & {
    hoursPerDay: Array<{ value: number }>;
    topUsers: Array<{ label: string; value: number }>;
  };
}

const workspace = async (days: number) =>
  (await Q.workspaceAnalytics(null, { days }, asAdmin)) as Workspace;

describe('workspaceAnalytics on a quiet workspace', () => {
  it('answers zeros, not errors, when nothing was tracked', async () => {
    const result = await workspace(1);

    expect(result.days).toBe(1);
    expect(result.timezone).toBe('UTC');
    expect(result.tracker).toMatchObject({
      sessions: 0,
      trackedUsers: 0,
      activeHours: 0,
      idleHours: 0,
      activityPercent: 0,
      topUsers: [],
      topApps: [],
    });
    expect(result.tracker.hoursPerDay).toEqual([{ period: expect.any(String), value: 0 }]);
  });

  it('reads its days in the workspace’s own timezone', async () => {
    await AppSettingsModel.create({ key: 'global', timezone: 'Asia/Kolkata' });

    expect((await workspace(7)).timezone).toBe('Asia/Kolkata');
  });

  it('names a tracked person whose account is gone as a former user', async () => {
    await TrackerSessionModel.create({
      userId: new Types.ObjectId().toHexString(),
      deviceId: 'd1',
      startedAt: new Date(),
      activeMs: 90 * 60 * 1000,
      idleMs: 0,
    });

    const { tracker } = await workspace(1);

    expect(tracker.topUsers).toEqual([{ label: 'Former user', value: 1.5 }]);
    expect(tracker.activityPercent).toBe(100);
  });

  it.each([0.5, 0, 366, Number.NaN])('refuses a period of %p days', async (days) => {
    await expect(workspace(days)).rejects.toThrow('The period must be between 1 and 365 days.');
  });

  it('accepts the longest period', async () => {
    await expect(workspace(365)).resolves.toMatchObject({ days: 365 });
  });

  it('refuses anybody without a signed-in admin', async () => {
    await expect(Q.workspaceAnalytics(null, { days: 7 }, { user: null })).rejects.toThrow(
      'Authentication required',
    );
  });
});

describe('platformAnalytics', () => {
  it('files accounts that belong to no company under no organization', async () => {
    await UserModel.create({
      name: 'Root',
      email: 'root@exyconn.com',
      passwordHash: 'x',
      roles: [ROLES.SUPER_ADMIN],
    });

    const platform = (await Q.platformAnalytics(null, {}, ctx([ROLES.SUPER_ADMIN]))) as {
      organizations: number;
      users: number;
      employees: number;
      usersByOrganization: Array<{ label: string; value: number }>;
      organizationsPerMonth: Array<{ period: string; value: number }>;
    };

    expect(platform).toMatchObject({ organizations: 0, users: 1, employees: 0 });
    expect(platform.usersByOrganization).toEqual([{ label: 'No organization', value: 1 }]);
    expect(platform.organizationsPerMonth.every((point) => point.value === 0)).toBe(true);
    expect(platform.organizationsPerMonth[11].period).toBe(new Date().toISOString().slice(0, 7));
  });

  it('refuses an anonymous caller', async () => {
    await expect(Q.platformAnalytics(null, {}, { user: null })).rejects.toThrow();
  });

  it('ships its schema', () => {
    expect(analyticsTypeDefs).toBeDefined();
  });
});
