import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * How long the foreground window belonged to a given app during an interval.
 * The desktop app aggregates per app+title before syncing, so one interval yields a
 * handful of rows rather than one row per focus change.
 *
 * `windowTitle` is empty when the portal setting `trackWindowTitles` is off.
 */
const trackerWindowUsageSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    intervalStartedAt: { type: Date, required: true },
    appName: { type: String, required: true, trim: true },
    windowTitle: { type: String, default: '', trim: true },
    durationMs: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

trackerWindowUsageSchema.index(
  { sessionId: 1, intervalStartedAt: 1, appName: 1, windowTitle: 1 },
  { unique: true },
);
trackerWindowUsageSchema.index({ userId: 1, intervalStartedAt: -1 });

export type TrackerWindowUsageDocument = InferSchemaType<typeof trackerWindowUsageSchema>;
export const TrackerWindowUsageModel: Model<TrackerWindowUsageDocument> =
  model<TrackerWindowUsageDocument>('TrackerWindowUsage', trackerWindowUsageSchema);
