import type { CaptureState, IconStatus, MeetingState, TranscriptionState } from '../types/meeting';

export interface IconInputs {
  meetingState: MeetingState;
  transcriptionState: TranscriptionState;
  captureState: CaptureState;
  /** Chunks recorded but not yet transcribed. */
  pendingUploads: number;
}

/**
 * The floating icon's state. A capture error first; then capturing; then audio still being
 * transcribed after a pause or stop; then anything that needs the user (Meet's transcription
 * off or unreadable during a call); otherwise idle.
 */
export function deriveIconStatus(inputs: IconInputs): IconStatus {
  if (inputs.captureState === 'ERROR') {
    return 'ERROR';
  }
  if (inputs.captureState === 'RECORDING') {
    return 'ACTIVE';
  }
  if (inputs.pendingUploads > 0) {
    return 'PROCESSING';
  }
  if (inputs.meetingState === 'IN_MEETING' && inputs.transcriptionState !== 'ON') {
    return 'ATTENTION';
  }
  return 'IDLE';
}

/** The words that go with each colour — never colour alone (WCAG 1.4.1). English source keys. */
export const ICON_STATUS_LABEL: Readonly<Record<IconStatus, string>> = {
  IDLE: 'Meeting assistant: idle',
  ATTENTION: 'Meeting assistant: needs your attention',
  ACTIVE: 'Meeting assistant: transcribing',
  PROCESSING: 'Meeting assistant: processing',
  ERROR: 'Meeting assistant: error',
};
