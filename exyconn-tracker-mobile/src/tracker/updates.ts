import * as Application from 'expo-application';
import { Linking, Platform } from 'react-native';
import { isNewerVersion, type LatestRelease } from '@exyconn/tracker-core';
import { portal } from './platform';

/**
 * Where this install is in its update cycle. A phone never installs itself — Android hands the
 * APK to its own installer, and an iPhone installs only through Apple's channels — so there is
 * no downloading/ready stage here, only "is there a newer build, and where is it".
 */
export type MobileUpdateStage = 'idle' | 'checking' | 'available' | 'failed';

export interface MobileUpdateState {
  stage: MobileUpdateStage;
  /** The newer version, when there is one. */
  version: string;
  /** The APK (Android) or the release page (iOS, whose build must be installed by re-signing). */
  url: string;
  /** When the last check finished, so "Check for updates" visibly answers even when current. */
  lastCheckedAt: string | null;
}

/** How often a signed-in app looks again on its own. A release lands a few times a week. */
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

let update: MobileUpdateState = { stage: 'idle', version: '', url: '', lastCheckedAt: null };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function set(next: MobileUpdateState): void {
  update = next;
  for (const listener of listeners) {
    listener();
  }
}

/** The download for this phone on a release: the APK on Android, the release page on iOS. */
function downloadUrl(release: LatestRelease): string {
  if (Platform.OS === 'android') {
    return release.assets.find((asset) => asset.platform === 'android')?.url ?? release.url;
  }
  return release.url;
}

/** Looks for a newer build now. Needs a sign-in: the portal serves releases to employees. */
export async function checkForUpdate(): Promise<void> {
  set({ ...update, stage: 'checking' });
  try {
    const release = await portal.fetchLatestRelease(Platform.OS);
    const current = Application.nativeApplicationVersion ?? '';
    const newer = release !== null && isNewerVersion(release.version, current);
    set({
      stage: newer ? 'available' : 'idle',
      version: newer ? release.version : '',
      url: newer ? downloadUrl(release) : '',
      lastCheckedAt: new Date().toISOString(),
    });
  } catch (error) {
    // A tracker that cannot reach its update feed keeps tracking; the next check tries again.
    console.error('Update check failed', error);
    set({ ...update, stage: 'failed', lastCheckedAt: new Date().toISOString() });
  }
}

/** Opens the new build — the browser downloads the APK and Android's installer takes over. */
export async function openUpdate(): Promise<void> {
  if (update.url !== '') {
    await Linking.openURL(update.url);
  }
}

/** Starts (or stops) the background check with the sign-in, so a signed-out app never asks. */
export function scheduleUpdateChecks(signedIn: boolean): void {
  if (!signedIn) {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
    return;
  }
  if (timer !== null) {
    return;
  }
  checkForUpdate().catch((error: unknown) => console.error('Update check failed', error));
  timer = setInterval(() => {
    checkForUpdate().catch((error: unknown) => console.error('Update check failed', error));
  }, CHECK_EVERY_MS);
}

export function subscribeUpdate(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUpdate(): MobileUpdateState {
  return update;
}
