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
    /** The project this run of the tracker books its time against. */
    projectId: { type: String, default: '', index: true },
    /**
     * The project's name as it was when the session opened. Denormalised so a renamed or
     * deleted project cannot rewrite what an already-recorded timesheet says it was for.
     */
    projectName: { type: String, default: '', trim: true },
    /**
     * The ticket this run of the tracker is against, when the employee picked one.
     *
     * Empty is a real answer — time can belong to a project without belonging to any one
     * ticket, and refusing to track until somebody picks a card would cost the time. The key
     * and title are denormalised for the same reason the project's name is: a time log is
     * read long after a ticket may have been renamed, moved or deleted, and a row that says
     * EXY-14 is worth more than an id that no longer resolves.
     */
    taskId: { type: String, default: '', index: true },
    taskKey: { type: String, default: '', trim: true },
    taskTitle: { type: String, default: '', trim: true },
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
