import { Dimensions } from 'react-native';
import {
  ForegroundUsage,
  MAX_CAPTURE_BYTES,
  blurWidth,
  capturePolicy,
  type EngineDeps,
  type ForegroundSampler,
  type ScreenCapture,
  type TrackerSettings,
} from '@exyconn/tracker-core';
import { TrackerNative } from '../../native/tracker-native';
import { releaseKeepAlive } from '../keep-alive';
import { cameraGranted } from '../permissions';
import { baseDeps, type PlatformContext } from './shared';

type Native = NonNullable<typeof TrackerNative>;

/** The ongoing notification Android requires while the tracking service runs. */
const KEEP_ALIVE_TITLE = 'Exyconn Tracker is tracking';
const KEEP_ALIVE_BODY = 'Your work time is being recorded. Tap to open the tracker.';

/** Why a start is refused when the workspace takes screenshots and capture was declined. */
export const CAPTURE_DECLINED =
  'Your workspace takes screenshots while you track, so tracking needs screen capture. Tap Start again and choose "Start now" to allow it.';

/** Every display is one on a phone; its id is fixed so the portal groups them as one screen. */
const DISPLAY_ID = '0';

/** The screen's real width in pixels — what "native resolution" means for the quality dial. */
function nativeWidth(): number {
  const screen = Dimensions.get('screen');
  return Math.round(screen.width * screen.scale);
}

/** Reads the app in front from usage stats and hands it to the shared usage accounting. */
function foregroundSampler(native: Native): ForegroundSampler {
  const usage = new ForegroundUsage();
  return {
    sample(now) {
      const app = native.getForegroundApp()?.label ?? '';
      // A phone has no window titles, only apps.
      usage.observe(now, app, '');
      return Promise.resolve(app);
    },
    drain: (now, keepTitles) => usage.drain(now, keepTitles),
  };
}

/**
 * The size of the capture the engine is about to composite the webcam photo into. The engine
 * composes each capture straight after taking it, and a phone takes one per burst, so the last
 * capture is always the one being composed.
 */
let lastCaptureSize = { width: 0, height: 0 };

export function lastCaptureDimensions(): { width: number; height: number } {
  return lastCaptureSize;
}

/** One capture of the screen, encoded by the desktop's own policy. */
async function captureScreen(
  native: Native,
  settings: TrackerSettings,
  context: PlatformContext,
): Promise<ScreenCapture[]> {
  if (!native.hasScreenCapture()) {
    context.onCaptureLost();
    return [];
  }
  const policy = capturePolicy(settings, nativeWidth());
  const shot = await native.captureScreen({
    lossless: policy.lossless,
    quality: settings.screenshotQuality,
    targetWidth: policy.targetWidth,
    blurWidth: settings.blurScreenshots ? blurWidth(policy.targetWidth ?? nativeWidth()) : null,
    maxBytes: MAX_CAPTURE_BYTES,
  });
  if (shot === null) {
    return [];
  }
  lastCaptureSize = { width: shot.width, height: shot.height };
  return [
    {
      image: shot.base64,
      mimeType: shot.mimeType,
      displayId: DISPLAY_ID,
      blurred: settings.blurScreenshots,
    },
  ];
}

/**
 * Holds what a session needs for its whole length: the foreground service that keeps tracking
 * alive off screen, and — when the workspace takes screenshots — the screen-capture grant.
 * Capture declined means no session: the workspace asked for screenshots, and a tracker that
 * ran without them would be a different tracker from the one the employee consented to.
 */
function session(native: Native, context: PlatformContext): NonNullable<EngineDeps['session']> {
  return {
    async begin() {
      const settings = context.settings();
      await native.startKeepAlive({
        title: KEEP_ALIVE_TITLE,
        body: KEEP_ALIVE_BODY,
        camera: settings.webcamEnabled && cameraGranted(),
      });
      if (settings.screenshotsPerInterval > 0 && !(await native.requestScreenCapture())) {
        releaseKeepAlive();
        await native.stopKeepAlive();
        throw new Error(CAPTURE_DECLINED);
      }
    },
    async end() {
      native.releaseScreenCapture();
      releaseKeepAlive();
      await native.stopKeepAlive();
    },
  };
}

/** Android: screen and lock state, usage stats, screen capture and a foreground service. */
export function androidDeps(native: Native, context: PlatformContext): EngineDeps {
  return {
    ...baseDeps(),
    idleSeconds: () => native.getIdleSeconds(),
    foreground: foregroundSampler(native),
    capture: (settings) => captureScreen(native, settings, context),
    session: session(native, context),
  };
}
