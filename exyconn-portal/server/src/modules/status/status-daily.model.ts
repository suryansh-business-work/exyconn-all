import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One monitor's rolled-up day. Every probe increments this document instead of writing
 * a row of its own, so ninety days of history for twenty services is ~1800 small
 * documents rather than half a million — which is what the uptime bars and the daily
 * charts on the status page read.
 *
 * `date` is the UTC calendar day as `YYYY-MM-DD` so a day is addressable without a range
 * query, and `totalResponseMs` divided by `checks` gives the day's average latency.
 */
const statusDailySchema = new Schema(
  {
    serviceKey: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    checks: { type: Number, required: true, default: 0 },
    failures: { type: Number, required: true, default: 0 },
    degraded: { type: Number, required: true, default: 0 },
    totalResponseMs: { type: Number, required: true, default: 0 },
    maxResponseMs: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

statusDailySchema.index({ serviceKey: 1, date: 1 }, { unique: true });
statusDailySchema.index({ date: 1 });

export type StatusDailyDocument = InferSchemaType<typeof statusDailySchema>;
export const StatusDailyModel: Model<StatusDailyDocument> = model<StatusDailyDocument>(
  'StatusDaily',
  statusDailySchema,
);
