import type { OrgContext } from '../../types/messages';
import { isCapturing, type TabSession } from '../../storage/session-registry';

/**
 * Why capture may not start on this tab, as an English source string — or null when it may.
 * Recording never starts by itself: this is checked after the user's click, and consent
 * must already be on record.
 */
export function captureBlocker(
  session: TabSession | null,
  org: OrgContext | null,
  otherCapturingTab: TabSession | null,
): string | null {
  if (org === null) {
    return 'Sign in to Exyconn to transcribe meetings';
  }
  if (!org.enabled) {
    return 'Meeting transcription is turned off for your company';
  }
  if (
    session?.meetingId == null ||
    session.meetingStartedAt === null ||
    session.meetingState !== 'IN_MEETING'
  ) {
    return 'Join the call before starting transcription';
  }
  if (otherCapturingTab !== null) {
    return 'This call is already being transcribed in another tab';
  }
  if (!session.consentRecorded) {
    return 'Confirm that participants know the call is transcribed';
  }
  if (isCapturing(session)) {
    return 'Transcription is already running';
  }
  return null;
}

/** A tab session with its server meeting open. */
export type LiveTabSession = TabSession & { meetingId: string; meetingStartedAt: string };

/** Throws the blocker (an English source string) unless capture may start on this tab. */
export function assertCapturable(
  session: TabSession | null,
  org: OrgContext | null,
  otherCapturingTab: TabSession | null,
): asserts session is LiveTabSession {
  const blocker = captureBlocker(session, org, otherCapturingTab);
  if (blocker !== null) {
    throw new Error(blocker);
  }
}

/** True once a capture has run for the company's maximum meeting length. */
export function captureExpired(
  session: TabSession,
  maxMeetingMinutes: number,
  now: number,
): boolean {
  return (
    isCapturing(session) &&
    session.captureStartedAt !== null &&
    maxMeetingMinutes > 0 &&
    now - session.captureStartedAt >= maxMeetingMinutes * 60_000
  );
}

/** What a failed upload means for the user, as an English source string. */
export function uploadFailureMessage(reason: string): string {
  const messages: Record<string, string> = {
    consent_required: 'Confirm that participants know the call is transcribed',
    meeting_ended: 'This meeting has ended on the server',
    too_long: 'This meeting reached the maximum length your company allows',
    too_large: 'An audio chunk was too large to upload',
    unsupported_audio: 'The server did not accept the audio format. Update the extension.',
    budget_exceeded: "Your company's monthly transcription budget is used up",
    disabled: 'Meeting transcription is turned off for your company',
    signed_out: 'Sign in again to continue transcribing',
    backpressure: 'Uploads are falling behind, so capture is paused until they catch up',
  };
  return messages[reason] ?? 'Audio could not be uploaded. Check your connection and try again.';
}
