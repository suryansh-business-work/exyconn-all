import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** What happened, or is meant to happen. */
export const ACTIVITY_TYPES = ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK'] as const;

/** What the activity is about. One activity belongs to exactly one of these. */
export const ACTIVITY_SUBJECTS = ['DEAL', 'CONTACT', 'COMPANY'] as const;

/**
 * A logged interaction or a piece of follow-up. `relatedType` + `relatedId` say
 * what it is about, and `relatedName` is carried so a timeline reads without a
 * join. An activity with a `dueDate` and `done: false` is the follow-up queue.
 */
const activitySchema = new Schema(
  {
    type: { type: String, enum: ACTIVITY_TYPES, required: true, default: 'NOTE' },
    subject: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    relatedType: { type: String, enum: ACTIVITY_SUBJECTS, required: true, default: 'DEAL' },
    relatedId: { type: String, default: '', trim: true },
    relatedName: { type: String, default: '', trim: true },
    dueDate: { type: Date, default: null },
    done: { type: Boolean, required: true, default: false },
    owner: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export type ActivityDocument = InferSchemaType<typeof activitySchema>;
export const ActivityModel: Model<ActivityDocument> = model<ActivityDocument>(
  'Activity',
  activitySchema,
);
