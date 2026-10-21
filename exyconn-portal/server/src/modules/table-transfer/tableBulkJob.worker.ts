import type { GraphQLSchema } from 'graphql';
import type { ApolloServerPlugin } from '@apollo/server';
import type { GraphQLContext } from '../../middleware/auth';
import { currentOrganizationId, runAsPlatform } from '../../lib/tenant';
import { UserModel } from '../admin/user.model';
import { forEachOrganization } from '../organizations';
import { registerBackgroundJob } from '../tech/jobs.registry';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import { logger } from '../../utils/logger';
import { reasonOf } from '../../utils/errors';
import {
  resolveBulk,
  runBulkChunk,
  type BulkAction,
  type BulkResult,
  type ResolvedBulk,
} from './tableBulk';
import { collectMatchingIds } from './tableBulkMatching';
import { MAX_JOB_ROWS } from './tableBulkJob';
import { TableBulkJobModel, type TableBulkJob } from './tableBulkJob.model';

/** How often the process looks for a job to carry on with. */
const TICK_MS = 2_000;
/** How long one pass holds a job; renewed after every chunk, so it lapses only on a dead pass. */
const LEASE_MS = 60_000;
/** How long one pass works on a job before handing it back, so other companies get a turn. */
const SLICE_MS = 4_000;
/** Ids acted on between saves of the cursor: at most this many are re-run after a crash. */
const CHUNK_SIZE = 25;
/** The failures kept with their reasons; the count covers the rest. */
const MAX_KEPT_FAILURES = 100;

/** The executable schema every job runs the modules' own operations through. */
let schema: GraphQLSchema | null = null;

/** Hands the worker Apollo's schema once the server has built it. */
export const tableBulkJobSchemaPlugin: ApolloServerPlugin<GraphQLContext> = {
  serverWillStart: (service) => {
    schema = service.schema;
    return Promise.resolve();
  },
};

/** Test seam: the schema the worker runs jobs through. */
export function setTableBulkJobSchema(next: GraphQLSchema | null): void {
  schema = next;
}

/**
 * The person who started the job, re-read now: a job acts with their roles as they are at this
 * moment, and stops once the account is deactivated or blocked — as their requests would.
 */
async function actorOf(job: TableBulkJob): Promise<GraphQLContext | null> {
  const user = await runAsPlatform(() =>
    UserModel.findById(job.userId).select('email roles isActive isBlocked').lean(),
  );
  if (!user?.isActive || user.isBlocked) {
    return null;
  }
  const organizationId = currentOrganizationId();
  return {
    user: { id: job.userId, email: user.email, roles: user.roles, organizationId },
    organizationId,
  };
}

async function finish(job: TableBulkJob, error: string | null): Promise<void> {
  job.status = error === null ? 'DONE' : 'FAILED';
  job.error = error;
  job.leaseUntil = null;
  job.finishedAt = new Date();
  await job.save();
}

function record(job: TableBulkJob, acted: number, result: BulkResult): void {
  job.processed += acted;
  job.succeeded += result.succeeded;
  job.failedCount += result.failures.length;
  const room = Math.max(0, MAX_KEPT_FAILURES - job.failures.length);
  job.failures.push(...result.failures.slice(0, room));
  job.leaseUntil = new Date(Date.now() + LEASE_MS);
}

/** "Select all matching": the ids the list's query matches, read once and kept on the job. */
async function collect(jobSchema: GraphQLSchema, ctx: GraphQLContext, job: TableBulkJob) {
  const variables = JSON.parse(job.variables ?? '{}') as Record<string, unknown>;
  const ids = await collectMatchingIds(jobSchema, ctx, job.list ?? '', variables, MAX_JOB_ROWS);
  job.ids = ids;
  job.total = ids.length;
  job.collected = true;
  job.leaseUntil = new Date(Date.now() + LEASE_MS);
  await job.save();
}

interface ChunkRun {
  jobSchema: GraphQLSchema;
  ctx: GraphQLContext;
  bulk: ResolvedBulk;
  job: TableBulkJob;
}

/**
 * Acts on the job's next chunk and saves the cursor, then the one after, until every id is done
 * or `deadline` has passed. Chunk after chunk: the saved cursor is what a restart resumes from.
 */
async function workChunks(run: Readonly<ChunkRun>, deadline: number): Promise<void> {
  const { jobSchema, ctx, bulk, job } = run;
  if (job.processed >= job.ids.length || Date.now() >= deadline) {
    return;
  }
  const chunk = job.ids.slice(job.processed, job.processed + CHUNK_SIZE);
  record(job, chunk.length, await runBulkChunk(jobSchema, ctx, bulk, chunk));
  await job.save();
  await workChunks(run, deadline);
}

/** One pass over a claimed job: chunks until it is done or its slice of time is up. */
async function workOn(jobSchema: GraphQLSchema, job: TableBulkJob, sliceMs: number): Promise<void> {
  const ctx = await actorOf(job);
  if (!ctx) {
    await finish(job, 'The person who started this can no longer make changes');
    return;
  }
  const action = job.action as BulkAction;
  // A list's job names its entity too (it was read off the list); the list is what decides.
  const entity = job.list ? null : job.entity;
  const bulk = resolveBulk(jobSchema, { list: job.list, entity, action });
  if (!job.collected) {
    await collect(jobSchema, ctx, job);
  }
  await workChunks({ jobSchema, ctx, bulk, job }, Date.now() + sliceMs);
  if (job.processed >= job.ids.length) {
    await finish(job, null);
    return;
  }
  job.leaseUntil = null;
  await job.save();
}

/**
 * Claims the company's oldest job that no live pass holds — queued, or running with its lease
 * lapsed (the process that held it died) — and works on it for one slice (`sliceMs`, a few
 * seconds unless a test says otherwise). Reports whether it
 * found one. `findOneAndUpdate` claims in the read, so two passes never take the same job.
 * A refusal for the whole job (FORBIDDEN, a list that no longer offers the action) ends it.
 */
export async function runNextBulkJob(sliceMs = SLICE_MS): Promise<boolean> {
  if (!schema) {
    return false;
  }
  const now = new Date();
  const job = await TableBulkJobModel.findOneAndUpdate(
    {
      status: { $in: ['QUEUED', 'RUNNING'] },
      $or: [{ leaseUntil: null }, { leaseUntil: { $lt: now } }],
    },
    { $set: { status: 'RUNNING', leaseUntil: new Date(now.getTime() + LEASE_MS) } },
    { sort: { createdAt: 1 }, new: true },
  );
  if (!job) {
    return false;
  }
  try {
    await workOn(schema, job, sliceMs);
  } catch (error) {
    logger.error(error, 'Table bulk job stopped');
    await finish(job, reasonOf(error));
  }
  return true;
}

/** True while a tick is still going, so a slow one is never overlapped by the next. */
let ticking = false;

/**
 * Starts the loop that works through queued table bulk actions. `.unref()` so it never holds
 * the process open on shutdown; a job cut off by one is picked up again once its lease lapses.
 */
export function startTableBulkJobs(): void {
  const tick = () => {
    if (ticking) {
      return;
    }
    ticking = true;
    let worked = 0;
    forEachOrganization(async () => {
      if (await runNextBulkJob()) {
        worked += 1;
      }
    }, 'Table bulk jobs')
      .then(() => {
        const summary = worked > 0 ? `Worked on ${worked} job(s)` : 'Queue empty';
        recordJobRun(JOB_KEYS.tableBulkJobs, summary);
      })
      .catch((error: unknown) => logger.error(error, 'Table bulk job tick failed'))
      .finally(() => {
        ticking = false;
      });
  };
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Table bulk job worker started');
}

registerBackgroundJob({
  key: JOB_KEYS.tableBulkJobs,
  label: 'Table bulk actions',
  description: 'Works through "Delete / Archive / Restore selected" started from a table.',
  runOnce: () => runNextBulkJob(),
});
