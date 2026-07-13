import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One activity bucket (10 minutes by default) — the unit everything else hangs off.
 *
 * `keyCount` and `mouseCount` are COUNTS ONLY. The desktop app increments them from a
 * global input hook and discards the keycode; no key content is transmitted or stored.
 * See tracker.constants.ts for the privacy contract.
 */
const trackerIntervalSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    keyCount: { type: Number, required: true, default: 0, min: 0 },
    mouseCount: { type: Number, required: true, default: 0, min: 0 },
    activeMs: { type: Number, required: true, default: 0, min: 0 },
    idleMs: { type: Number, required: true, default: 0, min: 0 },
    /** Share of the interval with input activity, 0–100. */
    activityPercent: { type: Number, required: true, default: 0, min: 0, max: 100 },
  },
  { timestamps: true },
);

// The desktop app retries syncs, so the same interval can arrive twice. This makes the
// upsert idempotent and stops a flaky network from double-counting an employee's hours.
trackerIntervalSchema.index({ sessionId: 1, startedAt: 1 }, { unique: true });
trackerIntervalSchema.index({ userId: 1, startedAt: -1 });

export type TrackerIntervalDocument = InferSchemaType<typeof trackerIntervalSchema>;
export const TrackerIntervalModel: Model<TrackerIntervalDocument> = model<TrackerIntervalDocument>(
  'TrackerInterval',
  trackerIntervalSchema,
);
