import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { BOT_SOURCES, BOT_STATUSES } from '../ma.enums';

/**
 * One trip of the meeting bot into a Google Meet call, on behalf of its owner: the call is
 * recorded as the owner's meeting, exactly as if their extension had recorded it. `active` is
 * true until the trip is over, so one owner never has two bots in the same call.
 */
const botDispatchSchema = new Schema(
  {
    ownerId: { type: String, required: true },
    ownerName: { type: String, default: '' },
    meetingCode: { type: String, required: true },
    meetUrl: { type: String, required: true },
    title: { type: String, default: '', maxlength: 300 },
    source: { type: String, enum: BOT_SOURCES, required: true },
    /** The Google Calendar event the scan sent it for; null when sent by hand. */
    calendarEventId: { type: String, default: null },
    /** The bot is not picked up before this moment (a calendar event's start). */
    joinAt: { type: Date, required: true },
    status: { type: String, enum: BOT_STATUSES, default: 'QUEUED' },
    active: { type: Boolean, default: true },
    meetingId: { type: String, default: null },
    error: { type: String, default: '', maxlength: 500 },
    claimedAt: { type: Date, default: null },
    /** The bot's last report; a trip silent for too long is marked failed. */
    lastSeenAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

botDispatchSchema.index(
  { ownerId: 1, meetingCode: 1 },
  { unique: true, partialFilterExpression: { active: true } },
);
botDispatchSchema.index(
  { ownerId: 1, calendarEventId: 1 },
  { unique: true, partialFilterExpression: { calendarEventId: { $type: 'string' } } },
);
botDispatchSchema.index({ status: 1, joinAt: 1 });
botDispatchSchema.index({ ownerId: 1, createdAt: -1 });

export type MaBotDispatchDocument = InferSchemaType<typeof botDispatchSchema>;

export const MaBotDispatchModel: Model<MaBotDispatchDocument> = model<MaBotDispatchDocument>(
  'MaBotDispatch',
  botDispatchSchema,
);
