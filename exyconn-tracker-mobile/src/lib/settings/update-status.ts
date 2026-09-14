import { formatElapsed, type Translate } from '@exyconn/tracker-core';
import type { MobileUpdateState } from '../../tracker/updates';

/**
 * What the app can say about its last update check.
 *
 * An up-to-date install ends a check in the same `idle` it started in, so without the
 * timestamp "I looked and you are current" is indistinguishable from "I never looked" —
 * which is exactly what makes a Check button feel broken.
 */
export function updateStatus(t: Translate, update: MobileUpdateState, nowMs: number): string {
  if (update.stage === 'checking') {
    return t('Looking for a newer version…');
  }
  if (update.stage === 'available') {
    return t('Version {version} is available.', { version: update.version });
  }
  if (update.stage === 'failed') {
    return t('The last check could not reach the update service.');
  }
  if (update.lastCheckedAt === null) {
    return t('Not checked yet since this app started.');
  }
  const elapsed = formatElapsed(nowMs - new Date(update.lastCheckedAt).getTime());
  return t('Up to date — checked {elapsed}.', { elapsed: elapsed.toLowerCase() });
}

/** Why a phone has no "update automatically" switch: the OS, not the app, installs. */
export function installNote(t: Translate, isAndroid: boolean): string {
  if (isAndroid) {
    return t('A phone never updates itself: Android asks you before installing a new version.');
  }
  return t('A phone never updates itself: iPhone builds are installed by your administrator.');
}
