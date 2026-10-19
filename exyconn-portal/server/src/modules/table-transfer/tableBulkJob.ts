import { isValidObjectId } from 'mongoose';
import type { GraphQLSchema } from 'graphql';
import type { GraphQLContext } from '../../middleware/auth';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { badRequest } from '../../utils/errors';
import { resolveBulk, type BulkAction, type BulkFailure } from './tableBulk';
import { countMatching, type ListVariables } from './tableBulkMatching';
import { TableBulkJobModel, type BULK_JOB_STATUSES } from './tableBulkJob.model';

/** The most rows one job acts on, ticked or matching; above it the person narrows the filters. */
export const MAX_JOB_ROWS = 50_000;

export interface StartBulkJobInput {
  list?: string | null;
  entity?: string | null;
  action: BulkAction;
  /** The ticked rows; empty with `variables` to act on every row the list's query matches. */
  ids?: string[] | null;
  /** The variables the list's own query loads pages with ("Select all matching"). */
  variables?: ListVariables | null;
}

/** What a client reads of a job while it runs and once it is done. */
export interface BulkJobView {
  id: string;
  action: BulkAction;
  status: (typeof BULK_JOB_STATUSES)[number];
  total: number;
  processed: number;
  succeeded: number;
  failedCount: number;
  failures: BulkFailure[];
  error: string | null;
}

interface StoredJob {
  _id: unknown;
  action: string;
  status: string;
  total: number;
  processed: number;
  succeeded: number;
  failedCount: number;
  failures: BulkFailure[];
  error?: string | null;
}

export function jobView(job: StoredJob): BulkJobView {
  return {
    id: String(job._id),
    action: job.action as BulkAction,
    status: job.status as BulkJobView['status'],
    total: job.total,
    processed: job.processed,
    succeeded: job.succeeded,
    failedCount: job.failedCount,
    failures: job.failures.map(({ id, message }) => ({ id, message })),
    error: job.error ?? null,
  };
}

/** How many rows "Select all matching" acts on — checked now, so a refusal is immediate. */
async function matchingTotal(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  list: string | null | undefined,
  variables: ListVariables | null | undefined,
): Promise<number> {
  if (!list || !variables) {
    badRequest('Select at least one row');
  }
  const total = await countMatching(schema, ctx, list, variables);
  if (total === 0) {
    badRequest('No rows match the current search and filters');
  }
  return total;
}

/**
 * Queues a bulk action and answers at once with the job, which the worker then works through
 * in chunks. Everything that can be refused is refused here — the action the list or entity
 * does not offer, a matching query the person may not run, more rows than a job takes.
 */
export async function startBulkJob(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  input: StartBulkJobInput,
): Promise<BulkJobView> {
  const user = assertAuthenticated(ctx);
  const bulk = resolveBulk(schema, input);
  const ids = [...new Set((input.ids ?? []).filter((id) => id.trim() !== ''))];
  const matching = ids.length === 0;
  const total = matching
    ? await matchingTotal(schema, ctx, input.list, input.variables)
    : ids.length;
  if (total > MAX_JOB_ROWS) {
    badRequest(
      `${total} rows are selected; up to ${MAX_JOB_ROWS} at a time. Narrow the search or filters first.`,
    );
  }
  const job = await TableBulkJobModel.create({
    list: input.list ?? null,
    entity: bulk.entity,
    action: bulk.action,
    ids,
    variables: matching ? JSON.stringify(input.variables) : null,
    collected: !matching,
    total,
    userId: user.id,
  });
  return jobView(job);
}

/** A job's progress, for the person who started it; null for any other id. */
export async function readBulkJob(ctx: GraphQLContext, id: string): Promise<BulkJobView | null> {
  const user = assertAuthenticated(ctx);
  if (!isValidObjectId(id)) {
    return null;
  }
  const job = await TableBulkJobModel.findOne({ _id: id, userId: user.id })
    .select('-ids -variables')
    .lean();
  return job ? jobView(job) : null;
}
