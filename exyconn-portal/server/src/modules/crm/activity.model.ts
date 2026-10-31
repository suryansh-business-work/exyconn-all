import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { attachmentSchema } from '../../lib/attachments';

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
    relatedId: { type: String, default: '', trim: true, index: true },
    relatedName: { type: String, default: '', trim: true },
    dueDate: { type: Date, default: null },
    done: { type: Boolean, required: true, default: false },
    owner: { type: String, required: true, trim: true },
    /** Photos, documents and call or meeting recordings (audio or video). */
    attachments: { type: [attachmentSchema], default: [] },
    /** How long a call or meeting lasted, when someone logged it. */
    durationSeconds: { type: Number, default: null },
    /** When the assignee is emailed about it; null for an activity nobody asked to be reminded of. */
    remindAt: { type: Date, default: null },
    /** The user (id) the reminder email goes to; empty when there is no reminder. */
    assigneeId: { type: String, default: '', trim: true },
    assigneeName: { type: String, default: '', trim: true },
    /** Set when the reminder is claimed for sending; reset when its time is moved. */
    reminderSentAt: { type: Date, default: null },
    /** Failed sends so far; the job stops retrying after a few. */
    reminderAttempts: { type: Number, default: 0 },
    /**
     * Set when another module wrote the activity, e.g. `meeting:<meetingId>:CONTACT:<contactId>`
     * for meeting notes, so writing it again updates the same row. Empty for a typed activity.
     */
    sourceKey: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

/** The reminder job's claim and the calendar's date range both read these. */
activitySchema.index({ remindAt: 1, reminderSentAt: 1 });
activitySchema.index({ dueDate: 1 });
activitySchema.index({ sourceKey: 1 }, { partialFilterExpression: { sourceKey: { $gt: '' } } });

export type ActivityDocument = InferSchemaType<typeof activitySchema>;
export const ActivityModel: Model<ActivityDocument> = model<ActivityDocument>(
  'Activity',
  activitySchema,
);
