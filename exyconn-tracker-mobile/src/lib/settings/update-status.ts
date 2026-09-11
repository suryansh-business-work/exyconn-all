import { formatElapsed } from '@exyconn/tracker-core';
import type { MobileUpdateState } from '../../tracker/updates';

/**
 * What the app can say about its last update check.
 *
 * An up-to-date install ends a check in the same `idle` it started in, so without the
 * timestamp "I looked and you are current" is indistinguishable from "I never looked" —
 * which is exactly what makes a Check button feel broken.
 */
export function updateStatus(update: MobileUpdateState, nowMs: number): string {
  if (update.stage === 'checking') {
    return 'Looking for a newer version…';
  }
  if (update.stage === 'available') {
    return `Version ${update.version} is available.`;
  }
  if (update.stage === 'failed') {
    return 'The last check could not reach the update service.';
  }
  if (update.lastCheckedAt === null) {
    return 'Not checked yet since this app started.';
  }
  const elapsed = formatElapsed(nowMs - new Date(update.lastCheckedAt).getTime());
  return `Up to date — checked ${elapsed.toLowerCase()}.`;
}

/** Why a phone has no "update automatically" switch: the OS, not the app, installs. */
export function installNote(isAndroid: boolean): string {
  if (isAndroid) {
    return 'A phone never updates itself: Android asks you before installing a new version.';
  }
  return 'A phone never updates itself: iPhone builds are installed by your administrator.';
}
