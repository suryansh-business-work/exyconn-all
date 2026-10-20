import { readyToFinalize } from './logic/report';
import { forgetLiveSegments } from './live-segments';
import { api, logger, registry } from './services';

export const finalizeAlarm = (tabId: number): string => `finalize:${tabId}`;

/**
 * Finalizes the tab's meeting once the call is over, the recorder has flushed and every
 * chunk is uploaded — or at once when `force` is set (the safety alarm). maFinalizeSession
 * is idempotent on the server, so a second call after a retry is harmless.
 */
export async function maybeFinalize(tabId: number, force = false): Promise<void> {
  const session = await registry.get(tabId);
  if (session?.meetingId == null || !session.finalizePending) {
    return;
  }
  if (!force && !readyToFinalize(session)) {
    return;
  }
  try {
    await api.finalize(session.meetingId, new Date().toISOString());
  } catch (error) {
    logger.error('Could not finalize the meeting', error);
    return;
  }
  await chrome.alarms.clear(finalizeAlarm(tabId));
  forgetLiveSegments(session.meetingId);
  if (session.closing) {
    await registry.remove(tabId);
    return;
  }
  await registry.update(tabId, (s) => ({ ...s, finalizePending: false }));
}
