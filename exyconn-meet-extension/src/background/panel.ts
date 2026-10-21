import type { PanelRequest, PanelResults } from '../types/messages';
import { liveSegments } from './live-segments';
import { getOrg } from './org';
import { api, prefsStore, registry } from './services';

/**
 * Answers the in-Meet panel. The meeting id always comes from the tab's own session, so a
 * page can only ever read the call it is showing.
 */
export async function handlePanelRequest(
  tabId: number,
  request: PanelRequest,
): Promise<PanelResults[PanelRequest['op']]> {
  const session = await registry.get(tabId);
  const meetingId = session?.meetingId ?? null;
  if (meetingId === null) {
    throw new Error('The meeting has not started yet');
  }
  switch (request.op) {
    case 'followUp':
      return api.followUp(meetingId);
    case 'transcript': {
      const [org, prefs] = await Promise.all([getOrg(), prefsStore.read()]);
      if (!org?.liveTranscript || !prefs.liveTranscript) {
        throw new Error('Live transcript is turned off');
      }
      const rows = await api.transcript(meetingId, request.afterMs);
      return rows.map((row) => ({
        id: row.id,
        startMs: row.startMs,
        endMs: row.endMs,
        text: row.text,
        speakerLabel: row.speakerName ?? row.speakerLabel,
      }));
    }
    case 'liveSegments':
      return liveSegments(meetingId);
    case 'participants':
      return api.participants(meetingId);
    case 'notes':
      return api.notes(meetingId);
    case 'actions':
      return api.actions(meetingId, request.page);
    case 'setActionStatus':
      return api.setActionStatus(request.id, request.status);
  }
}
