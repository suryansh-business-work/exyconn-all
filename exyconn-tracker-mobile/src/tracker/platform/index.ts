import { Platform } from 'react-native';
import type { EngineDeps } from '@exyconn/tracker-core';
import { TrackerNative } from '../../native/tracker-native';
import { appStateIdleSeconds } from '../idle/app-state-idle';
import type { Capabilities } from '../types';
import { androidDeps } from './android';
import { baseDeps, type PlatformContext } from './shared';

const IS_ANDROID = Platform.OS === 'android';

/**
 * What this phone can observe. Android does nearly everything the desktop does; iOS lets an app
 * see nothing beyond itself, so an iPhone records time while the tracker is open and nothing else.
 */
export const capabilities: Capabilities = {
  screenshots: IS_ANDROID,
  foregroundApp: IS_ANDROID,
  inputCounts: false,
  webcam: IS_ANDROID,
  background: IS_ANDROID,
};

/** iOS: the app being on screen is the only signal it has. */
function iosDeps(): EngineDeps {
  return {
    ...baseDeps(),
    idleSeconds: appStateIdleSeconds,
    foreground: { sample: () => Promise.resolve(''), drain: () => [] },
    capture: () => Promise.resolve([]),
  };
}

/** The engine's platform half for the phone this runs on. */
export function createEngineDeps(context: PlatformContext): EngineDeps {
  if (IS_ANDROID) {
    if (TrackerNative === null) {
      throw new Error('This Android build is missing the tracker-native module.');
    }
    return androidDeps(TrackerNative, context);
  }
  return iosDeps();
}

export { portal, type PlatformContext } from './shared';
export { CAPTURE_DECLINED, lastCaptureDimensions } from './android';
