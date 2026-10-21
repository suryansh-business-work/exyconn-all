import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { PARTICIPANT_SOURCES, PARTICIPANT_STATUSES } from '../ma.enums';

const attendanceSchema = new Schema(
  {
    joinedAt: { type: Date, required: true },
    leftAt: { type: Date, default: null },
  },
  { _id: false },
);

/**
 * Somebody who actually joined a call (never merely invited). `key` identifies them within
 * the meeting: the Meet API participant name, or a normalised display name from the visible
 * UI. An email is only ever stored when it is verified — never guessed from a name.
 */
const participantSchema = new Schema(
  {
    meetingId: { type: String, required: true },
    key: { type: String, required: true },
    displayName: { type: String, required: true, trim: true, maxlength: 200 },
    email: { type: String, default: null },
    userId: { type: String, default: null },
    /** Organizer / co-host, only when a trustworthy source said so. */
    role: { type: String, default: null },
    status: { type: String, enum: PARTICIPANT_STATUSES, default: 'UNKNOWN' },
    source: { type: String, enum: PARTICIPANT_SOURCES, required: true },
    /** 0-1: 1 for the API or the extension user, lower for what the visible UI showed. */
    confidence: { type: Number, default: 0.5, min: 0, max: 1 },
    sessions: { type: [attendanceSchema], default: [] },
    rejoinCount: { type: Number, default: 0, min: 0 },
    totalSeconds: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

participantSchema.index({ meetingId: 1, key: 1 }, { unique: true });
participantSchema.index({ userId: 1, createdAt: -1 });

export type MaParticipantDocument = InferSchemaType<typeof participantSchema>;

export const MaParticipantModel: Model<MaParticipantDocument> = model<MaParticipantDocument>(
  'MaParticipant',
  participantSchema,
);
