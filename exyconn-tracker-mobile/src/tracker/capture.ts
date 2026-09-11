import {
  activityPercent,
  formatHoursMinutes,
  overlayRect,
  type CaptureReport,
  type ComposeInput,
  type TrackerSettings,
} from '@exyconn/tracker-core';
import { TrackerNative } from '../native/tracker-native';
import { APP_SCHEME } from './config';
import { cameraGranted } from './permissions';
import { lastCaptureDimensions } from './platform';

const OPEN_HINT = 'Tap to open it';

/** The deep link a capture notification opens: that capture's day in the gallery. */
export function captureUrl(capturedAt: string): string {
  return `${APP_SCHEME}://screenshots?capturedAt=${encodeURIComponent(capturedAt)}`;
}

/** The notification's text: what was taken, and how the session stands. */
export function captureText(report: CaptureReport): { title: string; body: string } {
  const { capture, stats } = report;
  const shots =
    capture.count === 1 ? 'Screenshot captured' : `${capture.count} screenshots captured`;
  const activity = activityPercent(stats.sessionActiveMs, stats.sessionIdleMs);
  const lines = [
    `Worked ${formatHoursMinutes(stats.sessionActiveMs)} · ${activity}% active`,
    stats.currentApp === '' ? '' : `In ${stats.currentApp}`,
    OPEN_HINT,
  ].filter(Boolean);
  return { title: `Exyconn Tracker — ${shots}`, body: lines.join('\n') };
}

/**
 * Announces a capture the moment it happens, showing the capture itself — the phone's version of
 * the desktop's rule that nobody is screenshotted without being told. The shutter is the
 * notification's own sound, so "silent" (the workspace's setting or this phone's mute) can never
 * leave the sound and the notification disagreeing.
 */
export function announceCapture(
  report: CaptureReport,
  settings: TrackerSettings | null,
  muted: boolean,
): void {
  if (TrackerNative === null || report.preview === undefined) {
    return;
  }
  const { title, body } = captureText(report);
  TrackerNative.showCaptureNotification({
    title,
    body,
    image: report.preview,
    mimeType: report.previewMimeType ?? 'image/jpeg',
    silent: muted || !(settings?.captureSoundEnabled ?? true),
    url: captureUrl(report.capture.capturedAt),
  });
}

/**
 * Takes one front-camera frame and composites it into the corner the workspace chose, exactly
 * where the desktop puts it. Null whenever there is no photo to add — no camera grant, no
 * native module, a camera that failed — and the engine then uploads the plain screenshot.
 */
export async function composeWithWebcam(input: ComposeInput): Promise<string | null> {
  if (TrackerNative === null || !cameraGranted()) {
    return null;
  }
  const photo = await TrackerNative.takeWebcamPhoto();
  if (photo === null) {
    console.error('Webcam photo unavailable; uploading the screenshot without one');
    return null;
  }
  const rect = overlayRect(input.corner, lastCaptureDimensions(), photo.width / photo.height);
  return TrackerNative.composeWebcam({
    screen: input.screen,
    mimeType: input.mimeType,
    photo: photo.base64,
    rect,
    quality: input.quality,
  });
}
