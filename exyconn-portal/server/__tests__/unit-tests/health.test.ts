import { healthResolvers } from '../../src/modules/health';
import { clearJobRuns, recordJobRun } from '../../src/utils/jobHeartbeat';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<SystemHealth>;

interface SystemHealth {
  serverVersion: string;
  nodeVersion: string;
  uptimeSeconds: number;
  mongo: { ok: boolean; dbName: string; collections: number; dataSizeMb: number };
  jobs: { key: string; label: string; enabled: boolean; lastRunAt: Date | null }[];
  counts: { label: string; value: number }[];
}

const systemHealth = healthResolvers.Query.systemHealth as unknown as Resolver;

const as = (roles: string[]) =>
  ({ user: { id: 'u1', email: 'u@x.com', roles } }) as unknown as GraphQLContext;
const admin = as([ROLES.ADMIN]);

beforeEach(() => clearJobRuns());

describe('systemHealth', () => {
  it('reports the process, a connected database and every background job', async () => {
    const health = await systemHealth(null, {}, admin);

    expect(health.serverVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(health.nodeVersion).toBe(process.version);
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(health.mongo.ok).toBe(true);
    expect(health.mongo.dbName).not.toBe('');
    expect(health.jobs.map((job) => job.key)).toEqual([
      'statusMonitor',
      'payrollDispatch',
      'trackerRetention',
      'trackerDigest',
    ]);
    expect(health.counts.map((count) => count.label)).toEqual([
      'Users',
      'Active users',
      'Open support tickets',
      'Unpaid invoices',
    ]);
  });

  it('shows a loop as never run until it ticks, then carries its heartbeat', async () => {
    const before = await systemHealth(null, {}, admin);
    expect(before.jobs.find((job) => job.key === 'statusMonitor')?.lastRunAt).toBeNull();

    recordJobRun('statusMonitor', 'Probed 3 services');
    const after = await systemHealth(null, {}, admin);
    expect(after.jobs.find((job) => job.key === 'statusMonitor')?.lastRunAt).toBeInstanceOf(Date);
  });

  it('counts the users it can see', async () => {
    await UserModel.create([
      { name: 'A', email: 'a@x.com', passwordHash: 'x', roles: [ROLES.HR], isActive: true },
      { name: 'B', email: 'b@x.com', passwordHash: 'x', roles: [ROLES.HR], isActive: false },
    ]);
    const health = await systemHealth(null, {}, admin);
    expect(health.counts.find((count) => count.label === 'Users')?.value).toBe(2);
    expect(health.counts.find((count) => count.label === 'Active users')?.value).toBe(1);
  });

  it('is ADMIN only', async () => {
    await expect(systemHealth(null, {}, as([ROLES.TECH]))).rejects.toThrow();
  });
});
