import {
  TrackerController as CoreController,
  type CaptureReport,
  type ComposeInput,
} from '@exyconn/tracker-core';
import type { AppPreferences, PermissionKind, PermissionState, TrackerState } from '@shared/types';
import { secureStore } from './store';
import { TrackerEngine } from './engine';
import * as portal from './portal-client';
import { collectDeviceInfo } from './device-info';
import { notifyAutoPaused, notifyAutoStopped, notifyMessages, notifyNotice } from './notifier';
import { getPermissions, requestPermission } from './trackers/permissions';

/**
 * The tracker's state machine (`@exyconn/tracker-core`) — auth, consent, attendance, the
 * schedule, the heartbeat — wired to this computer: its encrypted store, its OS
 * notifications, its macOS permissions and its engine. The rules themselves are shared with
 * the mobile app, so the two can never disagree about when tracking may start.
 */
export class TrackerController extends CoreController<
  PermissionState,
  AppPreferences,
  PermissionKind
> {
  constructor(
    onChange: (state: TrackerState) => void,
    /** Fired on every capture so the shell can announce it (notification + shutter sound). */
    onCapture: (report: CaptureReport) => void,
    /**
     * Adds the webcam photo to a screenshot. Injected rather than imported because it needs a
     * BrowserWindow, which this class deliberately knows nothing about — that is what keeps
     * it unit-testable.
     */
    composeWithWebcam: (input: ComposeInput) => Promise<string | null>,
  ) {
    super({
      portal,
      store: secureStore,
      deviceInfo: collectDeviceInfo,
      notifier: {
        autoPaused: notifyAutoPaused,
        autoStopped: notifyAutoStopped,
        messages: notifyMessages,
        notice: notifyNotice,
      },
      permissions: { get: getPermissions, request: requestPermission },
      createEngine: (settings, hooks) => new TrackerEngine(settings, hooks),
      onChange,
      onCapture,
      composeWithWebcam,
    });
  }
}
