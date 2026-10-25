import type { MaCaptureState, MaTranscriptionState } from '../graphql/generated';

/** Where the user is in the Meet page, as read from the visible UI. */
export type MeetingState =
  'PAGE_OPENED' | 'WAITING' | 'JOINING' | 'IN_MEETING' | 'RECONNECTING' | 'ENDED' | 'DISCONNECTED';

/** What the visible Meet UI says about Meet's own transcription. Never guessed. */
export type TranscriptionState = Extract<MaTranscriptionState, 'ON' | 'OFF' | 'UNKNOWN'>;

export type CaptureState = MaCaptureState;

/** Which recorded stream a chunk belongs to. */
export type AudioStream = 'TAB' | 'MIC';

/** How transcription audio is encoded: self-contained WebM/Opus files from MediaRecorder. */
export const AUDIO_MIME = 'audio/webm';
/** The screen recording: one continuous WebM (VP8 video, Opus audio) per recording part. */
export const VIDEO_MIME = 'video/webm';

/** What the worker hands the in-page recorder once a start has been checked. */
export interface CapturePlan {
  meetingId: string;
  /** The meeting's own clock starts here; chunk times are offsets from it. */
  meetingStartedAtMs: number;
  captureMic: boolean;
  /** Length of one transcription chunk. */
  chunkMs: number;
  /** Length of one screen-recording piece sent to the portal while the call runs. */
  pieceMs: number;
  /** The company keeps recordings: send the screen recording as well. */
  saveVideo: boolean;
  /** Which recording of this meeting this is (0 for the first Start, 1 after a restart, …). */
  videoPart: number;
}

/** One transcription chunk, as the in-page recorder hands it over. */
export interface RecordedAudio {
  meetingId: string;
  stream: AudioStream;
  startMs: number;
  durationMs: number;
  /** A self-contained WebM/Opus file, base64 (runtime messaging carries JSON only). */
  audio: string;
}

/** One piece of the screen recording; concatenated in `seq` order, a part plays as one file. */
export interface RecordedVideo {
  meetingId: string;
  part: number;
  seq: number;
  durationMs: number;
  /** WebM bytes, base64. */
  data: string;
}

/** The floating icon's state; each has its own colour AND its own words. */
export type IconStatus = 'IDLE' | 'ATTENTION' | 'ACTIVE' | 'PROCESSING' | 'ERROR';

/** One person seen in the visible participant list or tiles. Never carries an email. */
export interface SeenParticipant {
  /** Normalised display name — the diff key. */
  key: string;
  displayName: string;
  isSelf: boolean;
}

/** A transcript line as the extension shows it. */
export interface LiveSegment {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  speakerLabel: string | null;
}

/** The reminder bookkeeping kept per tab (see utils/reminders.ts). */
export interface ReminderState {
  shown: number;
  nextAt: number | null;
  snoozedUntil: number | null;
  dismissed: boolean;
  /** True while the in-meeting banner should be on screen. */
  bannerVisible: boolean;
}
