import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { JOB_KINDS, JOB_STATUSES } from '../ma.enums';

/**
 * One step of the after-meeting pipeline. `key` is the idempotency key (`analyze:<id>:<n>`):
 * enqueueing the same step twice finds the existing row. `runAfter` lets a step wait — the
 * official transcript takes Google a while to produce.
 */
const jobSchema = new Schema(
  {
    key: { type: String, required: true },
    kind: { type: String, enum: JOB_KINDS, required: true },
    meetingId: { type: String, required: true },
    status: { type: String, enum: JOB_STATUSES, default: 'QUEUED' },
    attempts: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 3, min: 1 },
    runAfter: { type: Date, required: true },
    lastError: { type: String, default: '' },
    /** Who asked for it (a regenerate, a send): named on what it produces. */
    requestedById: { type: String, default: null },
    requestedByName: { type: String, default: '' },
    /** Step options, e.g. the summary style of a regenerate. */
    style: { type: String, default: null },
  },
  { timestamps: true },
);

jobSchema.index({ key: 1 }, { unique: true });
jobSchema.index({ status: 1, runAfter: 1 });

export type MaJobDocument = InferSchemaType<typeof jobSchema>;

export const MaJobModel: Model<MaJobDocument> = model<MaJobDocument>('MaJob', jobSchema);
