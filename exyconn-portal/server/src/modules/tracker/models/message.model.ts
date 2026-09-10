import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import {
  TRACKER_MESSAGE_DIRECTIONS,
  TRACKER_MESSAGE_KINDS,
  TRACKER_MESSAGE_LIMITS,
} from '../tracker.constants';

/**
 * One message addressed to, or sent by, one employee's tracker.
 *
 * `userId` is always the EMPLOYEE the thread belongs to, whichever way the message is
 * travelling — that is what makes "this person's conversation" a single index lookup, and
 * what keeps an employee's read of their own thread scoped to them without a join.
 *
 * An administrator's announcement is fanned out into one row per recipient rather than
 * stored once against "everybody". It costs a write per employee, and it buys per-person read
 * state, which is the whole point of a notice: knowing it actually reached somebody.
 */
const trackerMessageSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    kind: { type: String, required: true, enum: TRACKER_MESSAGE_KINDS, default: 'CHAT' },
    direction: { type: String, required: true, enum: TRACKER_MESSAGE_DIRECTIONS },
    /** Notices only — a chat line has no subject. */
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: TRACKER_MESSAGE_LIMITS.maxTitleChars,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: TRACKER_MESSAGE_LIMITS.maxBodyChars,
    },
    authorId: { type: String, required: true },
    /** Denormalised, so a departed administrator's messages still say who wrote them. */
    authorName: { type: String, default: '', trim: true },
    /** When the RECIPIENT read it. Null while it is still unread by whoever it is going to. */
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

trackerMessageSchema.index({ userId: 1, createdAt: -1 });
trackerMessageSchema.index({ userId: 1, direction: 1, readAt: 1 });

export type TrackerMessageDocument = InferSchemaType<typeof trackerMessageSchema>;
export const TrackerMessageModel: Model<TrackerMessageDocument> = model<TrackerMessageDocument>(
  'TrackerMessage',
  trackerMessageSchema,
);
