/**
 * The Meeting Assistant's fixed vocabularies, shared by the models, the SDL enums and the
 * services. Each list mirrors a GraphQL enum of the same name in ma.typeDefs.ts.
 */

/**
 * Whether Google Meet's own transcription is running. UNKNOWN is the honest answer whenever
 * it cannot be verified — never reported as OFF just because nothing could be read.
 */
export const TRANSCRIPTION_STATES = [
  'ON',
  'OFF',
  'UNKNOWN',
  'NOT_SUPPORTED',
  'PERMISSION_REQUIRED',
] as const;
export type TranscriptionState = (typeof TRANSCRIPTION_STATES)[number];

/** The extension's own audio capture, which only ever starts on the user's click. */
export const CAPTURE_STATES = ['IDLE', 'RECORDING', 'PAUSED', 'STOPPED', 'ERROR'] as const;
export type CaptureState = (typeof CAPTURE_STATES)[number];

export const MEETING_STATUSES = ['ACTIVE', 'ENDED'] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

/** A step of the after-meeting pipeline: official import, AI notes. */
export const STEP_STATUSES = [
  'NOT_STARTED',
  'QUEUED',
  'RUNNING',
  'READY',
  'FAILED',
  'SKIPPED',
] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];

export const EMAIL_STATUSES = [
  'NOT_SENT',
  'AWAITING_APPROVAL',
  'QUEUED',
  'SENT',
  'PARTIAL',
  'FAILED',
] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

export const SUMMARY_STYLES = [
  'SHORT',
  'DETAILED',
  'EXECUTIVE',
  'TECHNICAL',
  'SALES',
  'CLIENT',
  'STANDUP',
  'PROJECT_REVIEW',
] as const;
export type MaSummaryStyle = (typeof SUMMARY_STYLES)[number];

export const ACTION_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'BLOCKED',
  'COMPLETED',
  'CANCELLED',
] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

/** Statuses that still owe work: counted as pending and carried into the next meeting. */
export const OPEN_ACTION_STATUSES: ReadonlySet<ActionStatus> = new Set([
  'PENDING',
  'IN_PROGRESS',
  'BLOCKED',
]);

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type Priority = (typeof PRIORITIES)[number];

/** Where a transcript line came from: Google Meet's own transcript, or our AI transcription. */
export const TRANSCRIPT_SOURCES = ['GOOGLE_MEET', 'AI'] as const;
export type TranscriptSource = (typeof TRANSCRIPT_SOURCES)[number];

export const PARTICIPANT_STATUSES = ['JOINED', 'LEFT', 'UNKNOWN'] as const;
export type ParticipantStatus = (typeof PARTICIPANT_STATUSES)[number];

/**
 * How a participant is known: the official Meet API (high confidence), the visible Meet UI
 * (best effort), or the signed-in extension user themselves (verified).
 */
export const PARTICIPANT_SOURCES = ['GOOGLE_MEET_API', 'MEET_UI', 'EXTENSION_USER'] as const;
export type ParticipantSource = (typeof PARTICIPANT_SOURCES)[number];

export const LANGUAGES = ['AUTO', 'ENGLISH', 'HINDI', 'HINGLISH'] as const;
export type MaLanguage = (typeof LANGUAGES)[number];

export const RELEASE_CHANNELS = ['STABLE', 'BETA', 'INTERNAL'] as const;
export type ReleaseChannel = (typeof RELEASE_CHANNELS)[number];

export const RELEASE_STATUSES = [
  'DRAFT',
  'BUILDING',
  'BUILD_FAILED',
  'QA_PENDING',
  'READY_FOR_INTERNAL_TESTING',
  'INTERNAL_RELEASED',
  'READY_FOR_STORE_SUBMISSION',
  'SUBMITTED_FOR_REVIEW',
  'IN_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'DEPRECATED',
] as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

/** Approved artifacts an ordinary signed-in user may download. */
export const DOWNLOADABLE_RELEASE_STATUSES: ReadonlySet<ReleaseStatus> = new Set([
  'INTERNAL_RELEASED',
  'READY_FOR_STORE_SUBMISSION',
  'SUBMITTED_FOR_REVIEW',
  'IN_REVIEW',
  'PUBLISHED',
]);

export const JOB_KINDS = ['IMPORT_OFFICIAL', 'ANALYZE', 'EMAIL'] as const;
export type MaJobKind = (typeof JOB_KINDS)[number];

export const JOB_STATUSES = ['QUEUED', 'RUNNING', 'DONE', 'FAILED'] as const;
export type MaJobStatus = (typeof JOB_STATUSES)[number];

export const DELIVERY_STATUSES = ['PENDING', 'SENT', 'FAILED'] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

/** The permission-matrix module every organisation-wide Meeting Assistant screen checks. */
export const MA_PERMISSION_MODULE = 'MeetingAssistant';
/** The audit-log module every Meeting Assistant entry is filed under. */
export const MA_AUDIT_MODULE = 'Meeting Assistant';
