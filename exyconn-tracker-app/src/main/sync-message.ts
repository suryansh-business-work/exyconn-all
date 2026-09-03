import type { FailureKind } from './outbox';
import { TrackerAuthError, TrackerRejectedError } from './portal-client';
import { httpStatusOf } from './portal-error';

/**
 * Turns whatever the sync path threw into one sentence the employee can act on.
 * Never surfaces a stack, an error code, or the word "GraphQL" — if a sync did not happen,
 * they are owed a reason in plain English, not a log line.
 */
export function describeSyncFailure(error: unknown): string {
  if (error instanceof TrackerRejectedError) {
    return 'The portal refused some saved work, so it was skipped. Everything else was uploaded.';
  }
  if (error instanceof TrackerAuthError) {
    return 'Your tracker access was removed. Ask your administrator to restore it, then sign in again.';
  }

  // `fetch` rejects with a TypeError when it cannot open the connection at all.
  if (error instanceof TypeError) {
    return 'Cannot reach the portal. Check your internet connection — your work is saved and will upload once you are back online.';
  }

  if (error instanceof Error) {
    const status = httpStatusOf(error);
    return status === null ? error.message : describeHttpStatus(status);
  }

  return 'The sync failed for an unknown reason. Your work is saved and will be retried.';
}

function describeHttpStatus(status: number): string {
  if (status >= 500) {
    return 'The portal is temporarily unavailable. Your work is saved and will upload automatically once it is back.';
  }
  if (status === 413) {
    return 'A screenshot was too large for the portal to accept. Ask your administrator to lower the screenshot quality.';
  }
  if (status === 401 || status === 403) {
    return 'The portal would not accept this device. Sign out and sign in again.';
  }
  return 'The portal rejected the upload. Your work is saved and will be retried.';
}

/**
 * Retrying a rejection the portal has already made up its mind about only wedges everything
 * queued behind it, so those items are dropped instead.
 */
export function classifyFailure(error: unknown): FailureKind {
  return error instanceof TrackerRejectedError ? 'drop' : 'retry';
}
