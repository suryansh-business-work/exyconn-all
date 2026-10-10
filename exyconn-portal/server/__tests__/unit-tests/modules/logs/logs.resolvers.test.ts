import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { logsResolvers } from '../../../../src/modules/logs/logs.resolvers';
import {
  ingestLogBatch,
  resetLogIngestLimits,
  type LogBatchInput,
  type LogEntryInput,
} from '../../../../src/modules/logs/logs.ingest';
import { AppLogGroupModel } from '../../../../src/modules/logs/app-log-group.model';
import { AppLogEventModel } from '../../../../src/modules/logs/app-log-event.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { organizationOf } from '../../../../src/lib/tenant';
import { seedUser } from '../../../helpers';
import { seedPlatformOperator } from '../../security-authz.operator';
import { codeOf } from '../codeOf';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import ips from '../../../fixtures/ips.json';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const R = { ...logsResolvers.Query, ...logsResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;

const anonymous = { user: null, ip: ips.ip10_0_0_9 };

const entry = (overrides: Partial<LogEntryInput> = {}): LogEntryInput => ({
  level: 'ERROR',
  message: 'Render failed',
  errorName: 'TypeError',
  stack: 'TypeError: Render failed',
  occurredAt: new Date('2026-09-11T10:00:00Z'),
  ...overrides,
});

const batch = (
  entries: LogEntryInput[],
  overrides: Partial<LogBatchInput> = {},
): LogBatchInput => ({
  source: 'PORTAL',
  app: 'portal-hr',
  entries,
  ...overrides,
});

async function staff(roles: Role[]): Promise<GraphQLContext> {
  const user = await seedUser(`${randomUUID()}@exyconn.com`, randomUUID(), roles);
  const organizationId = String(organizationOf(user));
  await seedPlatformOperator(organizationId);
  return { user: { id: user.id, email: user.email, roles }, organizationId, ip: ips.ip10_0_0_1 };
}

const onlyGroup = async () => String((await AppLogGroupModel.findOne().lean())?._id);

beforeEach(() => resetLogIngestLimits());

describe('reading Tech > Logs', () => {
  it('opens one group with its id, and its occurrences newest first', async () => {
    await ingestLogBatch(
      batch([
        entry({ occurredAt: new Date('2026-09-11T08:00:00Z'), route: '/early' }),
        entry({ occurredAt: new Date('2026-09-11T12:00:00Z'), route: '/late' }),
      ]),
      anonymous,
    );
    const tech = await staff([ROLES.TECH]);
    const id = await onlyGroup();

    const group = (await R.getAppLogGroup(null, { id }, tech)) as { id: string; count: number };
    const events = (await R.listAppLogEvents(null, { groupId: id }, tech)) as Array<{
      id: string;
      route: string;
    }>;

    expect(group).toMatchObject({ id, count: 2 });
    expect(events.map((event) => event.route)).toEqual(['/late', '/early']);
    expect(typeof events[0].id).toBe('string');
  });

  it('counts the grid’s tiles by status, level and source', async () => {
    await ingestLogBatch(batch([entry(), entry({ level: 'WARN', count: 4 })]), anonymous);
    const tech = await staff([ROLES.TECH]);

    const stats = (await R.listAppLogGroupsStats(null, {}, tech)) as {
      total: number;
      counts: Array<{ field: string; buckets: Array<{ value: string; count: number }> }>;
      sums: Array<{ field: string; total: number }>;
    };

    expect(stats.total).toBe(2);
    expect(stats.counts.map((count) => count.field)).toEqual(['status', 'level', 'source']);
    expect(stats.sums).toEqual([{ field: 'count', total: 5 }]);
  });

  it('is NOT_FOUND for a group that does not exist', async () => {
    const tech = await staff([ROLES.TECH]);
    const id = new Types.ObjectId().toHexString();

    expect(await codeOf(R.getAppLogGroup(null, { id }, tech))).toBe('NOT_FOUND');
    expect(await codeOf(R.appLogFixPrompt(null, { id }, tech))).toBe('NOT_FOUND');
    expect(await codeOf(R.setAppLogGroupStatus(null, { id, status: 'IGNORED' }, tech))).toBe(
      'NOT_FOUND',
    );
    expect(await codeOf(R.deleteAppLogGroup(null, { id }, tech))).toBe('NOT_FOUND');
  });

  it('keeps the logs from staff outside Tech and from callers not signed in', async () => {
    const employee = await staff([ROLES.EMPLOYEE]);

    expect(await codeOf(R.listAppLogGroupsStats(null, {}, employee))).toBe('FORBIDDEN');
    expect(await codeOf(R.openAppLogsFixPrompt(null, {}, { user: null }))).toBe('UNAUTHENTICATED');
  });
});

describe('triage', () => {
  it('re-opens a resolved group and clears when it was resolved', async () => {
    await ingestLogBatch(batch([entry()]), anonymous);
    const tech = await staff([ROLES.TECH]);
    const id = await onlyGroup();
    await R.setAppLogGroupStatus(null, { id, status: 'RESOLVED' }, tech);

    const reopened = (await R.setAppLogGroupStatus(null, { id, status: 'OPEN' }, tech)) as {
      id: string;
      status: string;
      resolvedAt: Date | null;
    };

    expect(reopened).toMatchObject({ id, status: 'OPEN', resolvedAt: null });
  });
});

describe('the open-errors prompt', () => {
  beforeEach(async () => {
    await ingestLogBatch(batch([entry({ message: 'Portal crash' })]), anonymous);
    await ingestLogBatch(
      batch([entry({ message: 'Desktop crash', breadcrumbs: [] })], {
        source: 'DESKTOP',
        app: 'tracker-desktop',
      }),
      anonymous,
    );
    await ingestLogBatch(batch([entry({ level: 'WARN', message: 'Slow page' })]), anonymous);
  });

  it('holds every open error, and leaves warnings out', async () => {
    const tech = await staff([ROLES.TECH]);

    const prompt = (await R.openAppLogsFixPrompt(null, {}, tech)) as string;

    expect(prompt).toContain('# Fix these 2 open errors');
    expect(prompt).toContain('Portal crash');
    expect(prompt).toContain('Desktop crash');
    expect(prompt).not.toContain('Slow page');
  });

  it('narrows to one source when asked', async () => {
    const tech = await staff([ROLES.TECH]);

    const prompt = (await R.openAppLogsFixPrompt(null, { source: 'DESKTOP' }, tech)) as string;

    expect(prompt).toContain('# Fix these 1 open errors');
    expect(prompt).toContain('Desktop crash');
    expect(prompt).not.toContain('Portal crash');
  });

  it('still lists a group whose occurrences have expired', async () => {
    const tech = await staff([ROLES.TECH]);
    await AppLogEventModel.deleteMany({});

    const prompt = (await R.openAppLogsFixPrompt(null, { source: 'PORTAL' }, tech)) as string;

    expect(prompt).toContain('## 1. TypeError: Portal crash');
    expect(prompt).toContain('TypeError: Render failed');
  });
});

describe('reportClientLogs', () => {
  it('stores a batch with the request’s own address and agent', async () => {
    const accepted = await R.reportClientLogs(
      null,
      { input: batch([entry()]) },
      { user: null, ip: '192.0.2.10', userAgent: 'Chrome/141' },
    );

    expect(accepted).toBe(true);
    expect(await AppLogEventModel.findOne().lean()).toMatchObject({
      ip: '192.0.2.10',
      userAgent: 'Chrome/141',
    });
  });
});
