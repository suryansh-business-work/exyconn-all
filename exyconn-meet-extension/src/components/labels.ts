import type { CaptureState, MeetingState, TranscriptionState } from '../types/meeting';

/** English source strings for each state; translated with `t()` where they are shown. */
export const MEETING_STATE_LABEL: Readonly<Record<MeetingState, string>> = {
  PAGE_OPENED: 'Meet page opened',
  WAITING: 'Waiting to join',
  JOINING: 'Joining the call',
  IN_MEETING: 'In the meeting',
  RECONNECTING: 'Reconnecting',
  ENDED: 'Meeting ended',
  DISCONNECTED: 'Disconnected',
};

export const TRANSCRIPTION_LABEL: Readonly<Record<TranscriptionState, string>> = {
  ON: 'Meet transcription is on',
  OFF: 'Meet transcription is off',
  UNKNOWN: 'Meet transcription status unknown',
};

export const CAPTURE_LABEL: Readonly<Record<CaptureState, string>> = {
  IDLE: 'Not transcribing',
  RECORDING: 'Transcribing',
  PAUSED: 'Paused',
  STOPPED: 'Stopped',
  ERROR: 'Needs attention',
};
