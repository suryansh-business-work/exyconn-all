import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const BULK_JOB_STATUSES = ['QUEUED', 'RUNNING', 'DONE', 'FAILED'] as const;
export const BULK_ACTIONS = ['DELETE', 'ARCHIVE', 'RESTORE'] as const;

/** A finished job is kept this long for its progress to be read back, then dropped. */
const FINISHED_JOB_TTL_SECONDS = 7 * 24 * 60 * 60;

const failureSchema = new Schema(
  { id: { type: String, required: true }, message: { type: String, required: true } },
  { _id: false },
);

/**
 * One "Delete / Archive / Restore selected" on a table, worked through in the background by
 * the table bulk worker so the person can keep using the page.
 *
 * The ids are written once — at the start for ticked rows, or by the worker's first pass for
 * "Select all matching", which pages through the list's own query (`variables`) — and
 * `processed` is how far through them the job is. That cursor, saved after every chunk, plus a
 * lease that lapses when a process dies mid-chunk, is what lets another pass (or the same
 * server after a restart) carry on where it stopped. Scoped to its company by the tenant plugin.
 */
const tableBulkJobSchema = new Schema(
  {
    /** The paged list the rows came from; empty for a client-side table, which names `entity`. */
    list: { type: String, default: null },
    /** The record type: whose `delete<Entity>(id)` runs. */
    entity: { type: String, required: true },
    action: { type: String, enum: BULK_ACTIONS, required: true },
    ids: { type: [String], default: [] },
    /** The list query's variables (JSON) for "Select all matching"; null for ticked rows. */
    variables: { type: String, default: null },
    /** True once `ids` holds every row the job acts on. */
    collected: { type: Boolean, default: false },
    status: { type: String, enum: BULK_JOB_STATUSES, required: true, default: 'QUEUED' },
    total: { type: Number, default: 0, min: 0 },
    processed: { type: Number, default: 0, min: 0 },
    succeeded: { type: Number, default: 0, min: 0 },
    failedCount: { type: Number, default: 0, min: 0 },
    /** The first failures, with why; `failedCount` counts every one. */
    failures: { type: [failureSchema], default: [] },
    /** Why the whole job stopped, when it did. */
    error: { type: String, default: null },
    /** Who started it: the job acts as them, and only they read its progress. */
    userId: { type: String, required: true },
    /** While set and in the future, a worker pass holds the job. */
    leaseUntil: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

tableBulkJobSchema.index({ status: 1, createdAt: 1 });
tableBulkJobSchema.index({ finishedAt: 1 }, { expireAfterSeconds: FINISHED_JOB_TTL_SECONDS });

export type TableBulkJob = HydratedDocument<InferSchemaType<typeof tableBulkJobSchema>>;

export const TableBulkJobModel = model('TableBulkJob', tableBulkJobSchema);
