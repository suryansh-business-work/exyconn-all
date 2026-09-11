import type { ProgressStyle, ThemeMode, TrackerState } from '@exyconn/tracker-core';

/** A grant the phone can ask the OS for. */
export type PermissionKind = 'notifications' | 'usageAccess' | 'camera';

/**
 * What the phone still needs from the OS. Screen capture is not here: Android grants it per
 * session, so it is asked for when tracking starts rather than once on this screen.
 */
export interface MobilePermissions {
  /** Captures are announced by notification — required, like the desktop's announcement. */
  notifications: boolean;
  /** Android "Usage access": which app is in front. Reported granted on iOS, which has none. */
  usageAccess: boolean;
  /** Only required when the workspace has webcam capture on (and only on Android). */
  camera: boolean;
  allGranted: boolean;
}

/**
 * Choices that belong to this install, not the workspace. The desktop's tray and self-update
 * preferences have no phone equivalent: a phone has no tray, and the OS installs updates.
 */
export interface MobilePreferences {
  themeMode: ThemeMode;
  /** Silences the capture sound on THIS phone. The capture notification still appears. */
  muteCaptureSound: boolean;
  progressStyle: ProgressStyle;
  /**
   * The ground behind the cards turns to the workspace's brand gradient — the desktop's
   * see-through window, on a phone that has no desktop to show. Cards stay opaque.
   */
  transparentBackground: boolean;
  /** How much of the plain ground stays painted over that gradient, 0.5–0.9. */
  backgroundOpacity: number;
}

export type MobileTrackerState = TrackerState<MobilePermissions, MobilePreferences>;

/**
 * What this phone can observe — the UI states each missing one plainly rather than showing a
 * zero that looks like a measurement.
 */
export interface Capabilities {
  screenshots: boolean;
  foregroundApp: boolean;
  /** Key/tap counts across the whole device. No phone can measure these. */
  inputCounts: boolean;
  webcam: boolean;
  /** Keeps tracking while the app is not on screen. */
  background: boolean;
}
