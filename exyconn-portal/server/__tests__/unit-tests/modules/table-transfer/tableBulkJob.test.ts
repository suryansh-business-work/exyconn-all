import { randomUUID } from 'node:crypto';
import { GraphQLError, buildSchema, type GraphQLFieldResolver } from 'graphql';
import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import {
  MAX_JOB_ROWS,
  readBulkJob,
  startBulkJob,
} from '../../../../src/modules/table-transfer/tableBulkJob';
import { TableBulkJobModel } from '../../../../src/modules/table-transfer/tableBulkJob.model';
import {
  runNextBulkJob,
  setTableBulkJobSchema,
  startTableBulkJobs,
  tableBulkJobSchemaPlugin,
} from '../../../../src/modules/table-transfer/tableBulkJob.worker';
import { registerBulkTarget } from '../../../../src/modules/table-transfer/registry';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import * as heartbeat from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';
import { useTestOrganization } from '../../../helpers';

const organizationId = useTestOrganization();

/**
 * A list of `total` widgets (w1…), paged by `input` or — the CRM's shape — by `query`, with a
 * delete that refuses the ones named "locked" and "forbidden" the way a module's guard would.
 */
const schema = buildSchema(`
  input TableQueryInput { page: Int pageSize: Int search: String }
  input CrmQueryInput { page: Int! pageSize: Int! groups: [String!] }
  type Widget { id: ID! }
  type WidgetPage { rows: [Widget!]! totalCount: Int! }
  type Plain { name: String }
  type PlainPage { rows: [Plain!]! totalCount: Int! }
  type Query {
    listWidgetsPaged(input: TableQueryInput!): WidgetPage!
    searchWidgets(query: CrmQueryInput!, tag: String): WidgetPage!
    listPlainPaged(input: TableQueryInput!): PlainPage!
    widgets(limit: Int): WidgetPage!
  }
  type Mutation { deleteWidget(id: ID!): Boolean }
`);

let total = 0;
/** Ids already deleted, so later pages of the list stop serving them. */
const deleted = new Set<string>();
const pageCalls: Array<Record<string, unknown>> = [];
const archive = jest.fn(async (_ctx: GraphQLContext, ids: string[]) => ids.length);

function resolve(
  type: 'Query' | 'Mutation',
  name: string,
  fn: GraphQLFieldResolver<unknown, unknown>,
) {
  const field = (type === 'Query' ? schema.getQueryType() : schema.getMutationType())?.getFields()[
    name
  ];
  if (field) {
    field.resolve = fn;
  }
}

function pageOf(args: { page: number; pageSize: number }) {
  pageCalls.push(args);
  const all = Array.from({ length: total }, (_v, index) => `w${index + 1}`);
  const ids = all.slice(args.page * args.pageSize, (args.page + 1) * args.pageSize);
  return { totalCount: total, rows: ids.map((id) => ({ id })) };
}

resolve(
  'Query',
  'listWidgetsPaged',
  (_p, { input }: { input: { page: number; pageSize: number } }) => pageOf(input),
);
resolve('Query', 'searchWidgets', (_p, { query }: { query: { page: number; pageSize: number } }) =>
  pageOf(query),
);
resolve('Mutation', 'deleteWidget', (_p, { id }: { id: string }) => {
  if (id === 'locked') {
    throw new GraphQLError('It is on an open invoice', { extensions: { code: 'BAD_USER_INPUT' } });
  }
  if (id === 'forbidden') {
    throw new GraphQLError('Your role may not delete Widget', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  deleted.add(id);
  return true;
});
registerBulkTarget('searchWidgets', { entity: 'Widget', archive });

let userId = '';
let ctx: GraphQLContext;

async function seedUser(fields: Record<string, unknown> = {}) {
  const user = await UserModel.create({
    name: 'Bulk',
    email: `${randomUUID()}@example.com`,
    passwordHash: randomUUID(),
    roles: ['ADMIN'],
    isActive: true,
    organizationId,
    ...fields,
  });
  return user._id.toHexString();
}

/** Runs the worker until it finds nothing, and returns the job as it was left. */
async function drain(id: string) {
  while (await runNextBulkJob()) {
    // Each pass works one slice; keep going until no job is left to claim.
  }
  return TableBulkJobModel.findById(id).lean();
}

beforeEach(async () => {
  total = 0;
  deleted.clear();
  pageCalls.length = 0;
  setTableBulkJobSchema(schema);
  userId = await seedUser();
  ctx = { user: { id: userId, email: 'b@example.com', roles: [] }, organizationId };
  jest.spyOn(logger, 'info').mockImplementation(() => undefined);
  jest.spyOn(logger, 'error').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('startBulkJob', () => {
  it('queues the distinct ticked rows and answers with the job at once', async () => {
    const job = await startBulkJob(schema, ctx, {
      list: 'listWidgetsPaged',
      action: 'DELETE',
      ids: ['w1', 'w2', 'w1', ' '],
    });

    expect(job).toEqual({
      id: expect.any(String),
      action: 'DELETE',
      status: 'QUEUED',
      total: 2,
      processed: 0,
      succeeded: 0,
      failedCount: 0,
      failures: [],
      error: null,
    });
    const stored = await TableBulkJobModel.findById(job.id).lean();
    expect(stored).toMatchObject({ entity: 'Widget', ids: ['w1', 'w2'], collected: true, userId });
  });

  it('counts every matching row up front, as the person, and refuses an empty match', async () => {
    total = 3;
    const variables = { input: { search: 'acme' } };
    const job = await startBulkJob(schema, ctx, {
      list: 'listWidgetsPaged',
      action: 'DELETE',
      variables,
    });

    expect(job.total).toBe(3);
    expect(pageCalls).toEqual([{ search: 'acme', page: 0, pageSize: 1 }]);
    const stored = await TableBulkJobModel.findById(job.id).lean();
    expect(stored).toMatchObject({
      ids: [],
      collected: false,
      variables: JSON.stringify(variables),
    });

    total = 0;
    await expect(
      startBulkJob(schema, ctx, { list: 'listWidgetsPaged', action: 'DELETE', variables }),
    ).rejects.toThrow('No rows match the current search and filters');
  });

  it('needs ticked rows, or a list and its query to match', async () => {
    await expect(
      startBulkJob(schema, ctx, { list: 'listWidgetsPaged', action: 'DELETE' }),
    ).rejects.toThrow('Select at least one row');
    await expect(
      startBulkJob(schema, ctx, { entity: 'Widget', action: 'DELETE', variables: {} }),
    ).rejects.toThrow('Select at least one row');
  });

  it('refuses more rows than one job takes', async () => {
    total = MAX_JOB_ROWS + 1;
    await expect(
      startBulkJob(schema, ctx, {
        list: 'listWidgetsPaged',
        action: 'DELETE',
        variables: { input: {} },
      }),
    ).rejects.toThrow(`${MAX_JOB_ROWS + 1} rows are selected; up to ${MAX_JOB_ROWS} at a time`);
  });

  it('refuses a list whose rows carry no id, or a query that pages nothing', async () => {
    registerBulkTarget('listPlainPaged', { entity: 'Widget', archive });
    registerBulkTarget('widgets', { entity: 'Widget', archive });
    registerBulkTarget('missing', { entity: 'Widget', archive });
    for (const list of ['listPlainPaged', 'widgets', 'missing']) {
      await expect(
        startBulkJob(schema, ctx, { list, action: 'ARCHIVE', variables: { input: {} } }),
      ).rejects.toThrow(`Every matching row of ${list} cannot be selected`);
    }
  });
});

describe('readBulkJob', () => {
  it('shows a job only to the person who started it', async () => {
    const job = await startBulkJob(schema, ctx, {
      entity: 'Widget',
      action: 'DELETE',
      ids: ['w1'],
    });
    const other = {
      ...ctx,
      user: { id: new Types.ObjectId().toHexString(), email: 'o@x', roles: [] },
    };

    await expect(readBulkJob(ctx, job.id)).resolves.toMatchObject({ id: job.id, total: 1 });
    await expect(readBulkJob(other, job.id)).resolves.toBeNull();
    await expect(readBulkJob(ctx, 'not-an-id')).resolves.toBeNull();
  });
});

describe('the bulk worker', () => {
  it('deletes ticked rows through the module, recording what failed and finishing', async () => {
    const job = await startBulkJob(schema, ctx, {
      entity: 'Widget',
      action: 'DELETE',
      ids: ['w1', 'locked', 'w2'],
    });

    const done = await drain(job.id);

    expect(done).toMatchObject({
      status: 'DONE',
      processed: 3,
      succeeded: 2,
      failedCount: 1,
      failures: [{ id: 'locked', message: 'It is on an open invoice' }],
      leaseUntil: null,
      finishedAt: expect.any(Date),
    });
    expect([...deleted]).toEqual(['w1', 'w2']);
  });

  it('pages through every matching row itself, then acts on them in chunks', async () => {
    total = 230;
    const job = await startBulkJob(schema, ctx, {
      list: 'searchWidgets',
      action: 'ARCHIVE',
      variables: { query: { page: 9, pageSize: 9, groups: ['g'] }, tag: 'x' },
    });

    const done = await drain(job.id);

    expect(done).toMatchObject({ status: 'DONE', total: 230, processed: 230, succeeded: 230 });
    expect(pageCalls.slice(1)).toEqual([
      { page: 0, pageSize: 200, groups: ['g'] },
      { page: 1, pageSize: 200, groups: ['g'] },
    ]);
    expect(archive).toHaveBeenCalledTimes(Math.ceil(230 / 25));
    expect(archive).toHaveBeenLastCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ id: userId, roles: ['ADMIN'] }) }),
      expect.any(Array),
      true,
    );
  });

  it('stops a whole job at a refusal for the whole action', async () => {
    const job = await startBulkJob(schema, ctx, {
      list: 'listWidgetsPaged',
      action: 'DELETE',
      ids: ['w1', 'forbidden', 'w2'],
    });

    const done = await drain(job.id);

    expect(done).toMatchObject({ status: 'FAILED', error: 'Your role may not delete Widget' });
    expect(logger.error).toHaveBeenCalledWith(expect.any(GraphQLError), 'Table bulk job stopped');
  });

  it('stops once the person who started it can no longer make changes', async () => {
    const job = await startBulkJob(schema, ctx, {
      entity: 'Widget',
      action: 'DELETE',
      ids: ['w1'],
    });
    await UserModel.updateOne({ _id: userId }, { isBlocked: true });

    const done = await drain(job.id);

    expect(done).toMatchObject({
      status: 'FAILED',
      error: 'The person who started this can no longer make changes',
    });
    expect(deleted.size).toBe(0);
  });

  it('keeps the first hundred failures with reasons and counts the rest', async () => {
    const ids = Array.from({ length: 120 }, () => 'locked');
    const job = await startBulkJob(schema, ctx, {
      entity: 'Widget',
      action: 'DELETE',
      ids: ['w1'],
    });
    await TableBulkJobModel.updateOne({ _id: job.id }, { ids, total: 120 });

    const done = await drain(job.id);

    expect(done?.failedCount).toBe(120);
    expect(done?.failures).toHaveLength(100);
  });

  it('hands a job back once its slice of time is spent, and finishes it on later passes', async () => {
    const ids = Array.from({ length: 60 }, (_v, index) => `w${index + 1}`);
    const job = await startBulkJob(schema, ctx, { entity: 'Widget', action: 'DELETE', ids });
    // A pass with no time to spend hands the job straight back, cursor saved.
    await expect(runNextBulkJob(0)).resolves.toBe(true);
    const paused = await TableBulkJobModel.findById(job.id).lean();
    expect(paused).toMatchObject({ status: 'RUNNING', processed: 0, leaseUntil: null });

    const done = await drain(job.id);
    expect(done).toMatchObject({ status: 'DONE', processed: 60, succeeded: 60 });
  });

  it('leaves a job a live pass holds, and resumes one whose lease has lapsed', async () => {
    const job = await startBulkJob(schema, ctx, {
      entity: 'Widget',
      action: 'DELETE',
      ids: ['w1'],
    });
    await TableBulkJobModel.updateOne(
      { _id: job.id },
      { status: 'RUNNING', leaseUntil: new Date(Date.now() + 60_000) },
    );
    await expect(runNextBulkJob()).resolves.toBe(false);

    await TableBulkJobModel.updateOne({ _id: job.id }, { leaseUntil: new Date(Date.now() - 1) });
    const done = await drain(job.id);
    expect(done?.status).toBe('DONE');
  });

  it('does nothing before Apollo has handed it the schema', async () => {
    await startBulkJob(schema, ctx, { entity: 'Widget', action: 'DELETE', ids: ['w1'] });
    setTableBulkJobSchema(null);
    await expect(runNextBulkJob()).resolves.toBe(false);

    const serverWillStart = tableBulkJobSchemaPlugin.serverWillStart as (
      s: unknown,
    ) => Promise<void>;
    await serverWillStart({ schema });
    await expect(runNextBulkJob()).resolves.toBe(true);
  });
});

describe('startTableBulkJobs', () => {
  /** Starts the loop with its timer captured; returns the tick so the test drives it. */
  function start(): () => void {
    const interval = jest.spyOn(globalThis, 'setInterval');
    startTableBulkJobs();
    const call = interval.mock.calls.findIndex(([, ms]) => ms === 2_000);
    clearInterval(interval.mock.results[call].value);
    return interval.mock.calls[call][0] as () => void;
  }

  function nextHeartbeat(): Promise<string> {
    return new Promise((done) => {
      jest
        .spyOn(heartbeat, 'recordJobRun')
        .mockImplementationOnce((_key, summary) => done(summary));
    });
  }

  it('works on queued jobs every tick, never overlapping a tick still running', async () => {
    const tick = start();
    expect(logger.info).toHaveBeenCalledWith('Table bulk job worker started');

    const empty = nextHeartbeat();
    tick();
    await expect(empty).resolves.toBe('Queue empty');

    await startBulkJob(schema, ctx, { entity: 'Widget', action: 'DELETE', ids: ['w1'] });
    const worked = nextHeartbeat();
    tick();
    tick();
    await expect(worked).resolves.toBe('Worked on 1 job(s)');
    // One report per tick that ran: the overlapping second tick() was skipped.
    expect(heartbeat.recordJobRun).toHaveBeenCalledTimes(2);
  });

  it('logs a tick that fails instead of letting it escape', async () => {
    const tick = start();
    jest.spyOn(heartbeat, 'recordJobRun').mockImplementationOnce(() => {
      throw new Error('heartbeat down');
    });
    const logged = new Promise((done) => {
      jest.spyOn(logger, 'error').mockImplementationOnce((...args: unknown[]) => done(args));
    });

    tick();

    await expect(logged).resolves.toEqual([expect.any(Error), 'Table bulk job tick failed']);
  });

  it('is registered as a background job that runs one pass', async () => {
    const job = findBackgroundJob(heartbeat.JOB_KEYS.tableBulkJobs);

    expect(job?.label).toBe('Table bulk actions');
    await expect(job?.runOnce()).resolves.toBe(false);
  });
});
