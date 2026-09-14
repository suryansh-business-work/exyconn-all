import { formatCount, type Translate, type TrackerStatus } from '@exyconn/tracker-core';

/** What signing out does to a session that is still open. */
const SESSION_NOTE: Partial<Record<TrackerStatus, string>> = {
  tracking: 'Tracking is running. Signing out stops it, and the time up to now is kept.',
  paused: 'Your paused session ends when you sign out, and the time up to now is kept.',
};

function pendingNote(t: Translate, pending: number): string {
  if (pending <= 0) {
    return '';
  }
  const count = formatCount(pending);
  // Two whole sentences rather than an interpolated "item is"/"items are": a fragment cannot
  // be inflected by a language that agrees differently.
  if (pending === 1) {
    return t(
      '{count} item is still waiting to upload. Signing out sends them first, so it can take a moment on a slow connection.',
      { count },
    );
  }
  return t(
    '{count} items are still waiting to upload. Signing out sends them first, so it can take a moment on a slow connection.',
    { count },
  );
}

/**
 * The sign-out confirmation, saying what the desktop's close guard would: a running session
 * and anything still in the outbox. Sign-out already stops the session and flushes the outbox
 * before the token is dropped — this only makes sure the wait is not a surprise.
 */
export function signOutMessage(t: Translate, status: TrackerStatus, pending: number): string {
  const session = SESSION_NOTE[status];
  return [
    session === undefined ? '' : t(session),
    pendingNote(t, pending),
    t('You will need your portal email and password to sign in again.'),
  ]
    .filter((line) => line !== '')
    .join('\n\n');
}
