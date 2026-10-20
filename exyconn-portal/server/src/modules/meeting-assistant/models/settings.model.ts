import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { LANGUAGES, RELEASE_CHANNELS, SUMMARY_STYLES } from '../ma.enums';

/**
 * A company's Meeting Assistant settings: one row per company (`key` is unique per company
 * through the tenant plugin), created with these defaults the first time anyone reads it.
 * Per-person preferences (floating icon, theme, snooze) live in the extension's own storage.
 */
const settingsSchema = new Schema(
  {
    key: { type: String, required: true, default: 'global' },
    enabled: { type: Boolean, default: true },
    /** Empty means everyone in the company may use the assistant. */
    allowedUserIds: { type: [String], default: [] },
    remindersEnabled: { type: Boolean, default: true },
    reminderIntervalMinutes: { type: Number, enum: [1, 2, 5, 10], default: 2 },
    /** A hard ceiling so a reminder can never become spam. */
    maxRemindersPerMeeting: { type: Number, default: 5, min: 1, max: 30 },
    preferredLanguage: { type: String, enum: LANGUAGES, default: 'AUTO' },
    summaryStyle: { type: String, enum: SUMMARY_STYLES, default: 'DETAILED' },
    /** Keep the call audio (16 kHz PCM WAV) as well as its transcript. */
    saveRecordings: { type: Boolean, default: true },
    /** Days before saved recordings are deleted; 0 keeps them until the meeting is deleted. */
    audioRetentionDays: { type: Number, default: 90, min: 0, max: 3650 },
    /** Days before transcripts are deleted; 0 keeps them until the meeting is deleted. */
    transcriptRetentionDays: { type: Number, default: 180, min: 0, max: 3650 },
    autoGenerateSummary: { type: Boolean, default: true },
    autoEmail: { type: Boolean, default: false },
    emailRequiresApproval: { type: Boolean, default: true },
    /** Extra recipients of every summary; each must be in an allowed domain. */
    defaultRecipients: { type: [String], default: [] },
    /** Also email participants who were matched to a portal account. */
    emailParticipants: { type: Boolean, default: false },
    /** Domains a summary may be sent to. Empty allows only portal accounts' own addresses. */
    emailAllowedDomains: { type: [String], default: [] },
    analysisModel: { type: String, default: 'gpt-4o', trim: true },
    transcriptionModel: { type: String, default: 'gpt-4o-transcribe', trim: true },
    /** Uses gpt-4o-transcribe-diarize, which labels speakers (but never names them). */
    diarization: { type: Boolean, default: false },
    /** Company AI spend on meetings per calendar month; 0 means no limit. */
    monthlyBudgetUsd: { type: Number, default: 0, min: 0 },
    /** Longest call that will be transcribed, so a forgotten tab cannot run up a bill. */
    maxMeetingMinutes: { type: Number, default: 240, min: 5, max: 1440 },
    participantTracking: { type: Boolean, default: true },
    liveTranscript: { type: Boolean, default: true },
    releaseChannel: { type: String, enum: RELEASE_CHANNELS, default: 'STABLE' },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true },
);

settingsSchema.index({ key: 1 }, { unique: true });

export type MaSettingsDocument = InferSchemaType<typeof settingsSchema>;

export const MaSettingsModel: Model<MaSettingsDocument> = model<MaSettingsDocument>(
  'MaSettings',
  settingsSchema,
);
