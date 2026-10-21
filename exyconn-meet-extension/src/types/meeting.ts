import type { MaCaptureState, MaTranscriptionState } from '../graphql/generated';

/** Where the user is in the Meet page, as read from the visible UI. */
export type MeetingState =
  'PAGE_OPENED' | 'WAITING' | 'JOINING' | 'IN_MEETING' | 'RECONNECTING' | 'ENDED' | 'DISCONNECTED';

/** What the visible Meet UI says about Meet's own transcription. Never guessed. */
export type TranscriptionState = Extract<MaTranscriptionState, 'ON' | 'OFF' | 'UNKNOWN'>;

export type CaptureState = MaCaptureState;

/** Which recorded stream a chunk belongs to. */
export type AudioStream = 'TAB' | 'MIC';

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
