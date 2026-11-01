import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One meeting bot trip a demo visitor started, in the demo company: who asked (and agreed to the
 * recording terms), the bot trip it made, whether the notes were emailed to them, and when the
 * recorded meeting is deleted.
 */
const meetingBotDemoTripSchema = new Schema(
  {
    /** `visitor:<id>` or `user:<id>` (see lib/demoCaller). */
    callerKey: { type: String, required: true, index: true },
    callerName: { type: String, default: '', trim: true },
    callerEmail: { type: String, required: true, lowercase: true, trim: true },
    dispatchId: { type: String, required: true, index: true },
    meetingCode: { type: String, required: true },
    /** The recording terms exactly as shown when the visitor agreed, and when. */
    consentText: { type: String, required: true },
    consentAt: { type: Date, required: true },
    ip: { type: String, default: '' },
    /** Claimed before the notes email is sent, so it goes out once. */
    emailedAt: { type: Date, default: null },
    emailError: { type: String, default: '' },
    /** The recorded meeting is deleted at this moment. */
    purgeAfter: { type: Date, required: true },
    purgedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
meetingBotDemoTripSchema.index({ callerKey: 1, createdAt: -1 });
meetingBotDemoTripSchema.index({ purgedAt: 1, purgeAfter: 1 });

export type MeetingBotDemoTripDocument = InferSchemaType<typeof meetingBotDemoTripSchema>;
export const MeetingBotDemoTripModel: Model<MeetingBotDemoTripDocument> =
  model<MeetingBotDemoTripDocument>('MeetingBotDemoTrip', meetingBotDemoTripSchema);
