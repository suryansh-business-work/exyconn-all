import type { MeetReport } from '../../types/messages';
import type { SeenParticipant } from '../../types/meeting';
import type { TabSession } from '../../storage/session-registry';
import { canTransition, isLive } from '../../utils/meeting-state';
import { diffParticipants } from '../../utils/participants';

export interface ReportResult {
  session: TabSession;
  /** Live and no server session yet: open (or find again) the server's meeting. */
  needsServerSession: boolean;
  /** The call just ended for this user: stop capture and finalize. */
  ended: boolean;
}

/**
 * Folds one content-script report into the tab's session: the state moves only along
 * possible transitions, participant changes queue up as events while in the call, and the
 * result says what the worker must do next.
 */
export function applyReport(session: TabSession, report: MeetReport, nowIso: string): ReportResult {
  const moves =
    report.meetingState === session.meetingState ||
    canTransition(session.meetingState, report.meetingState);
  const meetingState = moves ? report.meetingState : session.meetingState;
  const inCall = meetingState === 'IN_MEETING';

  let roster = session.roster;
  let pendingEvents = session.pendingEvents;
  if (inCall && session.meetingId !== null) {
    const previous = new Map<string, SeenParticipant>(roster.map((p) => [p.key, p]));
    const diff = diffParticipants(
      previous,
      report.participants,
      report.participantsComplete,
      nowIso,
    );
    roster = [...diff.roster.values()];
    pendingEvents = [...pendingEvents, ...diff.events];
  }

  const next: TabSession = {
    ...session,
    url: report.url,
    title: report.title,
    meetingState,
    transcriptionState: inCall ? report.transcriptionState : 'UNKNOWN',
    roster,
    pendingEvents,
  };
  return {
    session: next,
    needsServerSession: isLive(meetingState) && session.meetingId === null,
    ended: meetingState === 'ENDED' && session.meetingState !== 'ENDED',
  };
}

/** Participant events go out in batches, at most this often unless the batch is full. */
export const EVENT_FLUSH_INTERVAL_MS = 10_000;

/** True when the queued participant events should be sent now. */
export function shouldFlushEvents(
  session: TabSession,
  batchSize: number,
  now: number,
  force: boolean,
): boolean {
  if (session.meetingId === null || session.pendingEvents.length === 0) {
    return false;
  }
  return (
    force ||
    session.pendingEvents.length >= batchSize ||
    now - session.eventsFlushedAt >= EVENT_FLUSH_INTERVAL_MS
  );
}

/** Ready to finalize: the call is over, the recorder has flushed, nothing waits to upload. */
export function readyToFinalize(session: TabSession): boolean {
  return (
    session.finalizePending &&
    session.meetingId !== null &&
    !session.recorderActive &&
    session.pendingUploads === 0
  );
}

/**
 * A reloaded page of the same call: a fresh page session that keeps the server meeting,
 * the consent, the reminder count and the capture outcome. Anything else starts over.
 */
export function resumeSession(previous: TabSession | null, fresh: TabSession): TabSession {
  if (previous?.meetingCode !== fresh.meetingCode || previous.finalizePending) {
    return fresh;
  }
  return {
    ...fresh,
    meetingId: previous.meetingId,
    meetingStartedAt: previous.meetingStartedAt,
    consentRecorded: previous.consentRecorded,
    reminder: previous.reminder,
    captureState: previous.captureState,
    captureError: previous.captureError,
    pendingUploads: previous.pendingUploads,
    videoPart: previous.videoPart,
  };
}
