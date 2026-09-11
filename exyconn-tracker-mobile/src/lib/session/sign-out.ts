import { formatCount, type TrackerStatus } from '@exyconn/tracker-core';

/** What signing out does to a session that is still open. */
const SESSION_NOTE: Partial<Record<TrackerStatus, string>> = {
  tracking: 'Tracking is running. Signing out stops it, and the time up to now is kept.',
  paused: 'Your paused session ends when you sign out, and the time up to now is kept.',
};

function pendingNote(pending: number): string {
  if (pending <= 0) {
    return '';
  }
  const what = pending === 1 ? 'item is' : 'items are';
  return `${formatCount(pending)} ${what} still waiting to upload. Signing out sends them first, so it can take a moment on a slow connection.`;
}

/**
 * The sign-out confirmation, saying what the desktop's close guard would: a running session
 * and anything still in the outbox. Sign-out already stops the session and flushes the outbox
 * before the token is dropped — this only makes sure the wait is not a surprise.
 */
export function signOutMessage(status: TrackerStatus, pending: number): string {
  return [
    SESSION_NOTE[status] ?? '',
    pendingNote(pending),
    'You will need your portal email and password to sign in again.',
  ]
    .filter((line) => line !== '')
    .join('\n\n');
}
