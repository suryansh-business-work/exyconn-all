import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const EVENT_LEVELS = ['INFO', 'WARN', 'ERROR'] as const;
export type MaEventLevel = (typeof EVENT_LEVELS)[number];

/**
 * The Meeting Assistant's own log: everything that happened to a meeting, in order — sign-in,
 * consent, capture, each audio chunk, the official import, notes, email, errors. Shown in the
 * AI portal's Logs page and each meeting's Activity tab. `details` carries ids, counts and
 * error codes only: never audio, transcript text, tokens or email bodies.
 */
const eventSchema = new Schema(
  {
    meetingId: { type: String, default: null },
    meetingTitle: { type: String, default: '' },
    /** Who may read it without the company view: the meeting's viewers and the actor. */
    viewerIds: { type: [String], default: [] },
    actorId: { type: String, default: 'system' },
    actorName: { type: String, default: 'Meeting Assistant' },
    type: { type: String, required: true, trim: true, maxlength: 60 },
    level: { type: String, enum: EVENT_LEVELS, default: 'INFO' },
    message: { type: String, required: true, maxlength: 1000 },
    details: { type: String, default: '', maxlength: 4000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

eventSchema.index({ createdAt: -1 });
eventSchema.index({ meetingId: 1, createdAt: -1 });
eventSchema.index({ viewerIds: 1, createdAt: -1 });

export type MaEventDocument = InferSchemaType<typeof eventSchema>;

export const MaEventModel: Model<MaEventDocument> = model<MaEventDocument>('MaEvent', eventSchema);
