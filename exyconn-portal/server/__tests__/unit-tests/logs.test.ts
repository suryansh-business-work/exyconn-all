import { randomUUID } from 'node:crypto';
import { GraphQLError } from 'graphql';
import {
  AppLogEventModel,
  AppLogGroupModel,
  buildFixPrompt,
  fingerprintOf,
  ingestLogBatch,
  logsResolvers,
  normalizeMessage,
  resetLogIngestLimits,
  serverErrorLogPlugin,
} from '../../src/modules/logs';
import { ROLES, type Role } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';
import type { LogBatchInput, LogEntryInput } from '../../src/modules/logs/logs.ingest';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const R = { ...logsResolvers.Query, ...logsResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;

const anonymous: GraphQLContext = { user: null, ip: '10.0.0.9', userAgent: 'jest' };

function entry(overrides: Partial<LogEntryInput> = {}): LogEntryInput {
  return {
    level: 'ERROR',
    message: 'Order 41 not found',
    errorName: 'TypeError',
    stack: 'TypeError: Order 41 not found\n    at load (index.bundle:1:200)',
    route: '/settings',
    occurredAt: new Date('2026-09-11T10:00:00Z'),
    breadcrumbs: [
      { at: new Date('2026-09-11T09:59:58Z'), level: 'DEBUG', message: 'Opened /settings' },
    ],
    ...overrides,
  };
}

function batch(entries: LogEntryInput[], overrides: Partial<LogBatchInput> = {}): LogBatchInput {
  return {
    source: 'MOBILE',
    app: 'tracker-mobile',
    appVersion: '1.9.8',
    platform: 'android',
    osVersion: '14',
    deviceModel: 'Pixel 7',
    entries,
    ...overrides,
  };
}

async function ctxWith(roles: Role[]): Promise<GraphQLContext> {
  const user = await seedUser(`${randomUUID()}@exyconn.com`, randomUUID(), roles);
  return { user: { id: user.id, email: user.email, roles }, ip: '10.0.0.1' };
}

beforeEach(() => resetLogIngestLimits());

describe('log grouping', () => {
  it('folds messages that differ only in ids and numbers into one fingerprint', () => {
    expect(normalizeMessage('Order 41 not found for 64b7f0c2a1b2c3d4e5f60718')).toBe(
      'Order <n> not found for <id>',
    );
    expect(fingerprintOf('MOBILE', 'a', 'ERROR', 'TypeError', 'Order 41 not found')).toBe(
      fingerprintOf('MOBILE', 'a', 'ERROR', 'TypeError', 'Order 42 not found'),
    );
  });

  it('counts every occurrence, the people affected and keeps each occurrence', async () => {
    const ctx = await ctxWith([ROLES.EMPLOYEE]);
    await ingestLogBatch(batch([entry(), entry({ message: 'Order 42 not found', count: 3 })]), {
      user: ctx.user,
      ip: ctx.ip,
    });
    await ingestLogBatch(batch([entry()]), anonymous);

    const groups = await AppLogGroupModel.find().lean();
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ count: 5, userCount: 1, status: 'OPEN', route: '/settings' });
    expect(groups[0].lastUserEmail).toBe(ctx.user?.email);
    const events = await AppLogEventModel.find().sort({ createdAt: 1 }).lean();
    expect(events).toHaveLength(3);
    expect(events[0]).toMatchObject({
      userVerified: true,
      platform: 'android',
      deviceModel: 'Pixel 7',
    });
    expect(events[0].breadcrumbs[0].message).toBe('Opened /settings');
  });

  it('marks a user the client only claimed as unverified', async () => {
    const claimed = { id: 'u1', name: 'Asha', email: 'asha@exyconn.com' };
    await ingestLogBatch(batch([entry()], { user: claimed }), anonymous);
    const event = await AppLogEventModel.findOne().lean();
    expect(event).toMatchObject({ userName: 'Asha', userVerified: false, ip: '10.0.0.9' });
  });

  it('stores a message that starts with $ as text, not a field path', async () => {
    await ingestLogBatch(
      batch([entry({ message: '$count is undefined', errorName: '' })]),
      anonymous,
    );
    const group = await AppLogGroupModel.findOne().lean();
    expect(group?.message).toBe('$count is undefined');
  });

  it('re-opens a resolved group when it happens again, but leaves an ignored one ignored', async () => {
    await ingestLogBatch(
      batch([entry(), entry({ message: 'Other', errorName: 'Error' })]),
      anonymous,
    );
    const [first, second] = await AppLogGroupModel.find().sort({ message: -1 }).lean();
    await AppLogGroupModel.updateOne(
      { _id: first._id },
      { status: 'RESOLVED', resolvedAt: new Date() },
    );
    await AppLogGroupModel.updateOne({ _id: second._id }, { status: 'IGNORED' });

    await ingestLogBatch(
      batch([entry(), entry({ message: 'Other', errorName: 'Error' })]),
      anonymous,
    );

    expect(await AppLogGroupModel.findById(first._id).lean()).toMatchObject({
      status: 'OPEN',
      resolvedAt: null,
    });
    expect((await AppLogGroupModel.findById(second._id).lean())?.status).toBe('IGNORED');
  });

  it('refuses an oversized batch and drops batches over the rate limit', async () => {
    await expect(
      ingestLogBatch(batch(Array.from({ length: 51 }, () => entry())), anonymous),
    ).rejects.toThrow('At most 50');

    const results: boolean[] = [];
    for (let i = 0; i < 301; i += 1) {
      results.push(await ingestLogBatch(batch([]), anonymous));
    }
    expect(results.at(-1)).toBe(false);
  });
});

describe('logs resolvers', () => {
  it('lets Tech read the grid and refuses everybody else', async () => {
    await ingestLogBatch(batch([entry()]), anonymous);
    const tech = await ctxWith([ROLES.TECH]);
    const page = (await R.listAppLogGroupsPaged(
      null,
      {
        input: {
          page: 0,
          pageSize: 25,
          filters: [{ field: 'source', op: 'EQUALS', value: 'MOBILE' }],
        },
      },
      tech,
    )) as { totalCount: number };
    expect(page.totalCount).toBe(1);

    const employee = await ctxWith([ROLES.EMPLOYEE]);
    await expect(
      R.listAppLogGroupsPaged(null, { input: { page: 0, pageSize: 25 } }, employee),
    ).rejects.toThrow();
  });

  it('resolves a group, then deletes it with every occurrence', async () => {
    await ingestLogBatch(batch([entry()]), anonymous);
    const tech = await ctxWith([ROLES.TECH]);
    const group = await AppLogGroupModel.findOne().lean();
    const id = String(group?._id);

    const resolved = (await R.setAppLogGroupStatus(null, { id, status: 'RESOLVED' }, tech)) as {
      status: string;
      resolvedAt: Date | null;
    };
    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolvedAt).toBeInstanceOf(Date);

    await R.deleteAppLogGroup(null, { id }, tech);
    expect(await AppLogGroupModel.countDocuments()).toBe(0);
    expect(await AppLogEventModel.countDocuments()).toBe(0);
  });
});

describe('Claude prompt', () => {
  it('holds the stack, what happened before and every recent occurrence', async () => {
    await ingestLogBatch(batch([entry({ context: '{"screen":"settings"}' })]), anonymous);
    const tech = await ctxWith([ROLES.TECH]);
    const group = await AppLogGroupModel.findOne().lean();
    const prompt = (await R.appLogFixPrompt(null, { id: String(group?._id) }, tech)) as string;

    expect(prompt).toContain('# Fix: TypeError: Order 41 not found');
    expect(prompt).toContain('at load (index.bundle:1:200)');
    expect(prompt).toContain('DEBUG Opened /settings');
    expect(prompt).toContain('exyconn-tracker-mobile/src');
    expect(prompt).toContain('| 1.9.8 | android 14 Pixel 7 | /settings | 1 |');
  });

  it('says so when there are no open errors', async () => {
    const tech = await ctxWith([ROLES.TECH]);
    expect(await R.openAppLogsFixPrompt(null, {}, tech)).toContain('No open errors');
  });

  it('renders a group with no occurrences left', () => {
    const at = new Date('2026-09-11T10:00:00Z');
    const prompt = buildFixPrompt(
      {
        source: 'SERVER',
        app: 'portal-server',
        level: 'ERROR',
        status: 'OPEN',
        errorName: '',
        message: 'boom',
        stack: '',
        route: 'listBugs',
        count: 1,
        userCount: 0,
        firstSeenAt: at,
        lastSeenAt: at,
      },
      [],
    );
    expect(prompt).toContain('No stack was captured.');
  });
});

describe('server error plugin', () => {
  async function runPlugin(errors: GraphQLError[]) {
    const hooks = await serverErrorLogPlugin.requestDidStart?.({} as never);
    await hooks?.didEncounterErrors?.({
      errors,
      contextValue: anonymous,
      operationName: 'ListBugs',
    } as never);
  }

  it('logs an unexpected resolver error with its operation', async () => {
    await runPlugin([
      new GraphQLError('Cannot read properties of undefined', { path: ['listBugs'] }),
    ]);
    const group = await AppLogGroupModel.findOne().lean();
    expect(group).toMatchObject({ source: 'SERVER', app: 'portal-server', route: 'ListBugs' });
  });

  it('ignores the errors that are a correct answer', async () => {
    await runPlugin([new GraphQLError('No', { extensions: { code: 'FORBIDDEN' } })]);
    expect(await AppLogGroupModel.countDocuments()).toBe(0);
  });
});
