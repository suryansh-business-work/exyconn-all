import type { MeetReport } from '../../types/messages';
import type { MeetingState } from '../../types/meeting';
import { nextMeetingState } from '../../utils/meeting-state';
import { observeMeetPage } from './page-state';
import { readParticipants } from './participants';
import { readMeetingTitle } from './title';
import { readTranscriptionState } from './transcription';

export { openTranscriptionControls, type ControlsResult } from './controls';
export { watchPage } from './observer';

/**
 * Reads everything the worker needs from the visible page in one pass. Participants are read
 * only while in the call and only when tracking is on (the user's AND the company's switch).
 */
export function readMeetPage(
  doc: Document,
  page: { meetingCode: string; url: string; previous: MeetingState; trackParticipants: boolean },
): MeetReport {
  const meetingState = nextMeetingState(page.previous, observeMeetPage(doc));
  const inCall = meetingState === 'IN_MEETING';
  const people =
    inCall && page.trackParticipants
      ? readParticipants(doc)
      : { participants: [], complete: false };
  return {
    meetingCode: page.meetingCode,
    url: page.url,
    title: readMeetingTitle(doc, page.meetingCode),
    meetingState,
    transcriptionState: inCall ? readTranscriptionState(doc) : 'UNKNOWN',
    participants: people.participants,
    participantsComplete: people.complete,
  };
}
