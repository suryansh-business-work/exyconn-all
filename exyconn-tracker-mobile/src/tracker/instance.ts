import { AppState } from 'react-native';
import { TrackerController, TrackerEngine } from '@exyconn/tracker-core';
import { TrackerNative } from '../native/tracker-native';
import { announceCapture, composeWithWebcam } from './capture';
import { deviceInfo, loadDeviceInfo } from './device-info';
import { configureNotifications, mobileNotifier, notifyCaptureStopped } from './notifier';
import { mobilePermissions, refreshPermissionSnapshot } from './permissions';
import { CAPTURE_DECLINED, createEngineDeps, portal } from './platform';
import { mobileStore } from './store';
import type {
  MobilePermissions,
  MobilePreferences,
  MobileTrackerState,
  PermissionKind,
} from './types';

let state: MobileTrackerState | null = null;
const listeners = new Set<() => void>();

function publish(next: MobileTrackerState): void {
  state = next;
  for (const listener of listeners) {
    listener();
  }
}

/**
 * The screen-capture session ended under a running session — the employee tapped Android's
 * "Stop sharing" chip, or the OS ended it. Tracking pauses and says why: the workspace asked for
 * screenshots, so the tracker does not carry on without them.
 */
function onCaptureLost(): void {
  if (state?.status !== 'tracking') {
    return;
  }
  tracker.pause();
  notifyCaptureStopped();
}

/**
 * The phone's tracker: the controller and engine the desktop runs (`@exyconn/tracker-core`),
 * wired to this phone's store, notifications, permissions and platform. One instance for the
 * app's life, so the tracking loop is independent of which screen is showing — or of any screen
 * at all, while the foreground service runs it with the app closed.
 */
export const tracker = new TrackerController<MobilePermissions, MobilePreferences, PermissionKind>({
  portal,
  store: mobileStore,
  deviceInfo,
  notifier: mobileNotifier,
  permissions: mobilePermissions,
  createEngine: (settings, hooks) =>
    new TrackerEngine(
      settings,
      hooks,
      createEngineDeps({ settings: () => state?.settings ?? settings, onCaptureLost }),
    ),
  onChange: publish,
  onCapture: (report) =>
    announceCapture(report, state?.settings ?? null, state?.preferences.muteCaptureSound ?? false),
  composeWithWebcam,
});

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): MobileTrackerState | null {
  return state;
}

/** Re-reads the OS grants and re-renders — after a request, or on returning from Settings. */
export async function refreshPermissions(): Promise<void> {
  await refreshPermissionSnapshot();
  tracker.refreshPermissions();
  publish(tracker.getState());
}

/** Asks the OS for one grant, then shows the answer. */
export async function requestPermission(kind: PermissionKind): Promise<void> {
  await tracker.requestPermission(kind);
  await refreshPermissions();
}

/**
 * Resumes a paused session. When the capture session it needs has gone (the reason it paused),
 * screen capture is asked for again first — resuming without it would only pause again.
 */
export async function resumeTracking(): Promise<void> {
  const needsCapture = (state?.settings?.screenshotsPerInterval ?? 0) > 0;
  if (TrackerNative !== null && needsCapture && !TrackerNative.hasScreenCapture()) {
    const granted = await TrackerNative.requestScreenCapture();
    if (!granted) {
      throw new Error(CAPTURE_DECLINED);
    }
  }
  tracker.resume();
}

let booted: Promise<void> | null = null;

/** Starts the tracker once: device facts, OS grants, then the remembered session, if any. */
export function bootTracker(): Promise<void> {
  booted ??= (async () => {
    await configureNotifications();
    await loadDeviceInfo();
    await refreshPermissionSnapshot();
    TrackerNative?.addListener('onScreenCaptureStopped', onCaptureLost);
    AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        refreshPermissions().catch((error: unknown) =>
          console.error('Refreshing permissions failed', error),
        );
      }
    });
    await tracker.restore();
  })();
  return booted;
}
