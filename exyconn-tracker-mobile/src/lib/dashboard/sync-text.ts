import { formatCount } from '@exyconn/tracker-core';
import type { LiveStats, TrackerSettings } from '@exyconn/tracker-core';

/** The upload cadence the portal has configured, in plain language. */
export function syncPolicyText(settings: TrackerSettings | null): string {
  if (!settings) {
    return 'Sync policy unavailable';
  }
  const mins = settings.syncIntervalMinutes;
  return `Uploads automatically every ${mins} minute${mins === 1 ? '' : 's'}`;
}

/** What the outbox holds right now: uploading, empty, or how much is queued. */
export function syncPendingText(stats: LiveStats): string {
  if (stats.syncing) {
    return 'Uploading…';
  }
  if (stats.pendingSync === 0) {
    return 'Everything uploaded';
  }
  return `${formatCount(stats.pendingSync)} waiting to upload`;
}
