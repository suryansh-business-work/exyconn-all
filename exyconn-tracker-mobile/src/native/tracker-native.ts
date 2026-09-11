import { requireOptionalNativeModule } from 'expo';

/**
 * The typed face of `modules/tracker-native` — the Android-only Kotlin module that does what an
 * Expo library cannot: hold a screen-capture session, read usage stats, keep a foreground
 * service running, take one front-camera frame, and post a notification showing the capture.
 *
 * Null on iOS, which offers none of these to any app. Every caller checks for that and states
 * the missing capability instead of pretending.
 */

/** How one screen capture is encoded — the desktop's capture policy, decided in JS. */
export interface NativeCaptureOptions {
  /** Keep native resolution and encode PNG (quality 100). Otherwise JPEG. */
  lossless: boolean;
  /** JPEG quality, 1–100. Ignored when lossless. */
  quality: number;
  /** Downscale to this width in px; null keeps the native width. */
  targetWidth: number | null;
  /** Pixelate: shrink to this width, then back up. Null when blur is off. */
  blurWidth: number | null;
  /** A lossless encode over this many bytes is re-encoded as JPEG 100 at the same size. */
  maxBytes: number;
}

export interface NativeCapture {
  /** Base64, no data-URL prefix. */
  base64: string;
  mimeType: string;
  width: number;
  height: number;
}

export interface NativeForegroundApp {
  packageName: string;
  /** The app's display name, e.g. "Chrome". */
  label: string;
}

/** One front-camera frame. Its size is what places it — `overlayRect` needs the aspect. */
export interface NativePhoto {
  /** Base64 JPEG, no data-URL prefix, already upright. */
  base64: string;
  width: number;
  height: number;
}

export interface NativeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NativeComposeInput {
  /** The screen capture, base64. */
  screen: string;
  mimeType: string;
  /** The webcam photo, base64 JPEG. */
  photo: string;
  /** Where the photo goes, in the capture's pixels (see `overlayRect`). */
  rect: NativeRect;
  /** 1–100, applied to the result exactly as it was to the screen. */
  quality: number;
}

export interface NativeKeepAliveOptions {
  /** The ongoing notification a foreground service must show. */
  title: string;
  body: string;
  /** Also hold the camera for the session (webcam capture is on and granted). */
  camera: boolean;
}

export interface NativeCaptureNotification {
  title: string;
  body: string;
  /** The capture itself, base64, shown as the notification's big picture. */
  image: string;
  mimeType: string;
  /** Plays the shutter (the "captures" channel) or not (the silent one). */
  silent: boolean;
  /** Opened when the notification is tapped — a deep link into the gallery. */
  url: string;
}

interface TrackerNativeModule {
  /**
   * Seconds the device has been out of use: the current screen-off/locked run while it lasts,
   * else the last completed run exactly once (so a run that ended between two JS ticks — a
   * face-unlock — is still seen). 0 while the device is in use.
   */
  getIdleSeconds(): number;
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): void;
  /** The app most recently moved to the foreground, from usage stats. Null without access. */
  getForegroundApp(): NativeForegroundApp | null;
  /** Shows Android's screen-capture consent. Resolves true once a capture session is live. */
  requestScreenCapture(): Promise<boolean>;
  hasScreenCapture(): boolean;
  releaseScreenCapture(): void;
  /** Encodes the latest frame of the live capture session. Null when there is none. */
  captureScreen(options: NativeCaptureOptions): Promise<NativeCapture | null>;
  /** One frame from the front camera, the camera released straight after. Null on failure. */
  takeWebcamPhoto(): Promise<NativePhoto | null>;
  composeWebcam(input: NativeComposeInput): Promise<string>;
  /** Starts the foreground service that keeps tracking alive while the app is not on screen. */
  startKeepAlive(options: NativeKeepAliveOptions): Promise<void>;
  stopKeepAlive(): Promise<void>;
  showCaptureNotification(options: NativeCaptureNotification): void;
  /** The employee (or the OS) ended the screen-capture session — the system "Stop" chip. */
  addListener(event: 'onScreenCaptureStopped', listener: () => void): { remove(): void };
}

export const TrackerNative = requireOptionalNativeModule<TrackerNativeModule>('TrackerNative');

/** The headless JS task the foreground service runs, so JS timers keep firing off-screen. */
export const KEEP_ALIVE_TASK = 'ExyconnTrackerKeepAlive';
