import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * What has already been chased, so nobody is told the same thing twice.
 *
 * The sweep runs hourly and a due date stays due for weeks, so without this a contract
 * expiring on Friday would notify its owner every hour until somebody renewed it — which
 * is how people learn to ignore a notification bell. The key carries the day it covers, so
 * a source that deliberately nags weekly can say so by putting the week in its key.
 */
const reminderLogSchema = new Schema(
  {
    /** Which sweep wrote this, so a source can be retired with its history. */
    source: { type: String, required: true, trim: true },
    /** Unique per thing-chased per window, e.g. `contract:<id>:2026-09-20`. */
    dedupeKey: { type: String, required: true, trim: true },
    /** How many people it reached — read by the sweep's own summary, not by a screen. */
    recipients: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

// One row per thing per window. The insert is the claim: two processes sweeping at once
// race on this index rather than both sending.
reminderLogSchema.index({ dedupeKey: 1 }, { unique: true });

export type ReminderLogDocument = InferSchemaType<typeof reminderLogSchema>;
export const ReminderLogModel: Model<ReminderLogDocument> = model<ReminderLogDocument>(
  'ReminderLog',
  reminderLogSchema,
);
