import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import {
  CAPTURE_STATES,
  EMAIL_STATUSES,
  LANGUAGES,
  MEETING_STATUSES,
  STEP_STATUSES,
  TRANSCRIPTION_STATES,
} from '../ma.enums';

/** What a diarization label ("Speaker 1") has been confirmed to be, by a person. */
const speakerMappingSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    /** Set only when the speaker was matched to a portal account. */
    userId: { type: String, default: null },
    confirmedById: { type: String, required: true },
    confirmedByName: { type: String, default: '' },
    confirmedAt: { type: Date, required: true },
  },
  { _id: false },
);

/**
 * One Google Meet call as one signed-in extension user attended it.
 *
 * `sessionKey` makes it idempotent: a reload, a reconnect or a second tab of the same call
 * finds this row again instead of opening another (see meeting.lifecycle). Two people
 * recording the same call own two rows — each owns what their own extension captured.
 */
const meetingSchema = new Schema(
  {
    /** `<ownerId>:<meetingCode>:<startedAt ms>`, unique per company. */
    sessionKey: { type: String, required: true },
    /** Google Meet's code, `abc-defg-hij`. Recurring calls reuse it, which links a series. */
    meetingCode: { type: String, required: true, trim: true, lowercase: true },
    url: { type: String, required: true, trim: true },
    title: { type: String, default: '', trim: true, maxlength: 300 },
    ownerId: { type: String, required: true },
    ownerName: { type: String, default: '' },
    ownerEmail: { type: String, default: '' },
    /** Everyone allowed to read it without the AI role: the owner and matched portal users. */
    viewerIds: { type: [String], default: [] },
    organizerName: { type: String, default: null },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, enum: LANGUAGES, default: 'AUTO' },
    /** Languages the transcription reported, e.g. ['en', 'hi']. */
    detectedLanguages: { type: [String], default: [] },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    lastHeartbeatAt: { type: Date, default: null },
    status: { type: String, enum: MEETING_STATUSES, default: 'ACTIVE' },
    participantCount: { type: Number, default: 0, min: 0 },
    transcriptionState: { type: String, enum: TRANSCRIPTION_STATES, default: 'UNKNOWN' },
    captureState: { type: String, enum: CAPTURE_STATES, default: 'IDLE' },
    /** When the owner confirmed everyone was told the call is being transcribed. */
    consentRecordedAt: { type: Date, default: null },
    audioSeconds: { type: Number, default: 0, min: 0 },
    recordingSeconds: { type: Number, default: 0, min: 0 },
    segmentCount: { type: Number, default: 0, min: 0 },
    officialImportStatus: { type: String, enum: STEP_STATUSES, default: 'NOT_STARTED' },
    summaryStatus: { type: String, enum: STEP_STATUSES, default: 'NOT_STARTED' },
    summaryError: { type: String, default: '' },
    emailStatus: { type: String, enum: EMAIL_STATUSES, default: 'NOT_SENT' },
    transcriptionFailures: { type: Number, default: 0, min: 0 },
    /** AI spend on this call: transcription plus analysis. */
    costUsd: { type: Number, default: 0, min: 0 },
    previousMeetingId: { type: String, default: null },
    speakerMappings: { type: [speakerMappingSchema], default: [] },
  },
  { timestamps: true },
);

meetingSchema.index({ sessionKey: 1 }, { unique: true });
// One live session per person per call: two tabs racing to start the same call meet here.
meetingSchema.index(
  { ownerId: 1, meetingCode: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } },
);
meetingSchema.index({ ownerId: 1, meetingCode: 1, startedAt: -1 });
meetingSchema.index({ meetingCode: 1, startedAt: -1 });
meetingSchema.index({ viewerIds: 1, startedAt: -1 });
meetingSchema.index({ status: 1, lastHeartbeatAt: 1 });
meetingSchema.index({ startedAt: -1 });

export type MaMeetingDocument = InferSchemaType<typeof meetingSchema>;

export const MaMeetingModel: Model<MaMeetingDocument> = model<MaMeetingDocument>(
  'MaMeeting',
  meetingSchema,
);
