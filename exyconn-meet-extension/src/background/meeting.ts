import type { MeetReport, OrgContext } from '../types/messages';
import { isCapturing, newTabSession, type TabSession } from '../storage/session-registry';
import { chunkArray } from '../utils/batch';
import type { ParticipantEvent } from '../utils/participants';
import { canonicalMeetUrl } from '../utils/meet-url';
import { PARTICIPANT_BATCH_SIZE } from '../services/meet-api';
import { applyReport, resumeSession, shouldFlushEvents } from './logic/report';
import { captureExpired } from './logic/capture-rules';
import { ensureHeartbeat, HEARTBEAT_ALARM, stopCapture } from './capture';
import { finalizeAlarm, maybeFinalize } from './finalize';
import { getOrg } from './org';
import { clearReminder, evaluateReminders } from './reminders';
import { api, logger, registry } from './services';
import { publish } from './state';

/** A page that vanished (reload, navigation) gets this long to come back before finalizing. */
const RECONNECT_GRACE_MS = 2 * 60_000;
/** Participant events kept unsent at most; older ones go when the portal is unreachable. */
const MAX_PENDING_EVENTS = 500;

/** Tabs whose server session is being opened right now — one maStartSession per tab. */
const opening = new Set<number>();

/** A Meet page loaded (or reloaded) in a tab. A reload of the same call keeps its meeting. */
export async function handleHello(
  tabId: number,
  page: { meetingCode: string; url: string; title: string },
): Promise<void> {
  await chrome.alarms.clear(finalizeAlarm(tabId));
  const existing = await registry.get(tabId);
  if (existing !== null && existing.meetingCode !== page.meetingCode) {
    // Straight from one call into another in the same tab: close the first one now.
    await endSession(tabId, false);
    await maybeFinalize(tabId, true);
  } else if (existing !== null && isCapturing(existing)) {
    await stopCapture(tabId, 'The page reloaded. Start transcription again to continue.');
  }
  const previous = await registry.get(tabId);
  await registry.put(resumeSession(previous, newTabSession(tabId, crypto.randomUUID(), page)));
  await publish(tabId);
}

async function openServerSession(tabId: number): Promise<void> {
  const org = await getOrg();
  const session = await registry.get(tabId);
  if (org === null || !org.enabled || session === null || opening.has(tabId)) {
    return;
  }
  opening.add(tabId);
  try {
    const meeting = await api.startSession({
      meetingCode: session.meetingCode,
      url: canonicalMeetUrl(session.meetingCode),
      title: session.title,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      startedAt: new Date().toISOString(),
    });
    await registry.update(tabId, (s) => ({
      ...s,
      meetingId: meeting.id,
      meetingStartedAt: meeting.startedAt,
      consentRecorded: meeting.consentRecordedAt !== null,
    }));
    await ensureHeartbeat();
  } catch (error) {
    logger.error('Could not open the meeting session', error);
  } finally {
    opening.delete(tabId);
  }
}

/**
 * Sends participant batches one after another — ORDER matters (a LEFT must not overtake its
 * JOINED) — and stops at the first failure. Resolves to how many events went out.
 */
async function sendBatches(meetingId: string, batches: ParticipantEvent[][]): Promise<number> {
  const [first, ...rest] = batches;
  if (first === undefined) {
    return 0;
  }
  try {
    await api.recordParticipantEvents(meetingId, first);
  } catch (error) {
    logger.warn('Could not send participant changes', error);
    return 0;
  }
  return first.length + (await sendBatches(meetingId, rest));
}

/** Sends queued participant changes in batches of at most 50, throttled. */
export async function flushEvents(tabId: number, force: boolean): Promise<void> {
  const session = await registry.get(tabId);
  if (
    session?.meetingId == null ||
    !shouldFlushEvents(session, PARTICIPANT_BATCH_SIZE, Date.now(), force)
  ) {
    return;
  }
  const org = await getOrg();
  if (!org?.participantTracking) {
    await registry.update(tabId, (s) => ({ ...s, pendingEvents: [] }));
    return;
  }
  const sent = await sendBatches(
    session.meetingId,
    chunkArray(session.pendingEvents, PARTICIPANT_BATCH_SIZE),
  );
  await registry.update(tabId, (s) => ({
    ...s,
    pendingEvents: s.pendingEvents.slice(sent).slice(-MAX_PENDING_EVENTS),
    eventsFlushedAt: sent > 0 ? Date.now() : s.eventsFlushedAt,
  }));
}

/** One debounced look at the page from the content script. */
export async function handleReport(tabId: number, report: MeetReport): Promise<void> {
  const session = await registry.get(tabId);
  if (session?.meetingCode !== report.meetingCode) {
    return;
  }
  const result = applyReport(session, report, new Date().toISOString());
  await registry.put(result.session);
  if (result.needsServerSession) {
    await openServerSession(tabId);
  }
  if (result.ended) {
    await endSession(tabId, false);
  }
  await flushEvents(tabId, false);
  await evaluateReminders(tabId);
}

/** The call is over for this tab (ended, left, or the tab closed): stop and finalize. */
export async function endSession(tabId: number, closing: boolean): Promise<void> {
  const session = await registry.update(tabId, (s) => ({
    ...s,
    finalizePending: s.meetingId !== null,
    closing,
    meetingState: closing ? 'DISCONNECTED' : s.meetingState,
  }));
  if (session === null) {
    return;
  }
  await stopCapture(tabId, null);
  await flushEvents(tabId, true);
  await clearReminder(tabId);
  if (session.meetingId === null) {
    if (closing) {
      await registry.remove(tabId);
    }
    return;
  }
  await chrome.alarms.create(finalizeAlarm(tabId), { when: Date.now() + RECONNECT_GRACE_MS });
  await maybeFinalize(tabId);
  if (!closing) {
    await publish(tabId);
  }
}

/** The page went away (reload or navigation); finalize only if it does not come back. */
export async function handleGone(tabId: number): Promise<void> {
  const session = await registry.update(tabId, (s) => ({ ...s, meetingState: 'DISCONNECTED' }));
  if (session !== null) {
    await clearReminder(tabId);
    await chrome.alarms.create(finalizeAlarm(tabId), { when: Date.now() + RECONNECT_GRACE_MS });
  }
}

/** The grace period ran out: finalize whatever is still open. */
export async function onFinalizeAlarm(tabId: number): Promise<void> {
  const session = await registry.get(tabId);
  if (session === null) {
    return;
  }
  if (!session.finalizePending) {
    await endSession(tabId, session.closing);
  }
  await maybeFinalize(tabId, true);
}

/** One live tab's minute: auto-stop at the company limit, heartbeat, flush participants. */
async function heartbeatOne(session: TabSession, org: OrgContext | null): Promise<void> {
  const meetingId = session.meetingId;
  if (meetingId === null) {
    return;
  }
  if (org !== null && captureExpired(session, org.maxMeetingMinutes, Date.now())) {
    await stopCapture(
      session.tabId,
      'Transcription stopped: the meeting reached the maximum length your company allows',
    );
  }
  try {
    await api.heartbeat(meetingId, {
      transcriptionState: session.transcriptionState,
      captureState: session.captureState,
      participantCount: session.roster.length,
      title: session.title,
    });
  } catch (error) {
    logger.warn('Meeting heartbeat failed', error);
  }
  await flushEvents(session.tabId, true);
}

/** Every minute while a call is live: heartbeat, auto-stop at the company's limit, flush. */
export async function onHeartbeat(): Promise<void> {
  const org = await getOrg();
  const live = (await registry.all()).filter((s) => s.meetingState === 'IN_MEETING');
  if (live.length === 0) {
    await chrome.alarms.clear(HEARTBEAT_ALARM);
    return;
  }
  await Promise.all(live.map((session) => heartbeatOne(session, org)));
}
