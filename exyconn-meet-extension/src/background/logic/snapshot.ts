import type { TabSession } from '../../storage/session-registry';
import type { TabSnapshot } from '../../types/messages';
import { deriveIconStatus } from '../../utils/icon-status';

/** The UI's view of a tab session: no tokens, no transcript, no participant names. */
export function toTabSnapshot(session: TabSession, captureElsewhere: boolean): TabSnapshot {
  return {
    tabId: session.tabId,
    meetingCode: session.meetingCode,
    meetingId: session.meetingId,
    meetingState: session.meetingState,
    transcriptionState: session.transcriptionState,
    captureState: session.captureState,
    captureError: session.captureError,
    consentRecorded: session.consentRecorded,
    micEnabled: session.micEnabled,
    pendingUploads: session.pendingUploads,
    participantCount: session.roster.length,
    captureElsewhere,
    reminderBanner: session.reminder.bannerVisible,
    iconStatus: deriveIconStatus({
      meetingState: session.meetingState,
      transcriptionState: session.transcriptionState,
      captureState: session.captureState,
      pendingUploads: session.pendingUploads,
    }),
  };
}
