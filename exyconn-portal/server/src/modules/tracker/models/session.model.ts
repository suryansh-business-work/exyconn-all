import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { SESSION_STATUSES } from '../tracker.constants';

/** One start→stop run of the desktop tracker. Tracking never runs without one. */
const trackerSessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    startedAt: { type: Date, required: true, index: true },
    endedAt: { type: Date, default: null },
    status: { type: String, required: true, enum: SESSION_STATUSES, default: 'active' },
    /** Rolled up from the session's intervals as they sync, so day views stay cheap. */
    activeMs: { type: Number, required: true, default: 0, min: 0 },
    idleMs: { type: Number, required: true, default: 0, min: 0 },
    keyCount: { type: Number, required: true, default: 0, min: 0 },
    mouseCount: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

trackerSessionSchema.index({ userId: 1, startedAt: -1 });

export type TrackerSessionDocument = InferSchemaType<typeof trackerSessionSchema>;
export const TrackerSessionModel: Model<TrackerSessionDocument> = model<TrackerSessionDocument>(
  'TrackerSession',
  trackerSessionSchema,
);
