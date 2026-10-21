import { randomUUID } from 'node:crypto';
import type { BrowserWindow } from 'electron';
import type { LocationProvider, TrackerLocationInput } from '@exyconn/tracker-core';
import { IPC, type LocationResult } from '@shared/types';
import { onTrusted } from './web-security';

/**
 * This computer's location, read from the OS location service.
 *
 * Electron has no main-process location API, so main asks the tracker window's renderer,
 * which calls `navigator.geolocation` (see the renderer's useLocationBridge). Chromium then
 * reads the OS: on macOS that is Core Location, which shows the system "allow location" prompt
 * the first time — it needs `NSLocationUsageDescription` / `NSLocationWhenInUseUsageDescription`
 * in Info.plist and, under the hardened runtime, the
 * `com.apple.security.personal-information.location` entitlement (both in electron-builder.yml
 * and build/entitlements.mac.plist), and Location Services switched on for the app in System
 * Settings > Privacy & Security. On Windows (Electron 33 / Chromium 130) Chromium's default
 * provider is Google's network location web service, which fails without a GOOGLE_API_KEY —
 * so main switches on Chromium's Windows provider instead (`WinrtGeolocationImplementation`
 * in index.ts, before the app is ready), which reads Windows Location Services. Windows'
 * "Location services" and "Let desktop apps access your location" must then be on; Settings
 * in the app opens that page (`openLocationSettings` in trackers/permissions.ts).
 *
 * The renderer is granted the `geolocation` permission for the app's own pages only
 * (lockDownPermissions in index.ts). A hidden window still answers, which matters because the
 * five-minute move check runs while the tracker sits in the tray.
 */

/**
 * How long main waits for a fix. Longer than the renderer's own geolocation timeout, so a slow
 * fix is reported by the renderer with its reason rather than cut off here.
 */
const TIMEOUT_MS = 20_000;

const pending = new Map<string, (result: LocationResult) => void>();

/** Wired once, at startup. The renderer answers on one channel, keyed by request id. */
export function registerLocationBridge(): void {
  onTrusted(IPC.locationResult, (_event, result: LocationResult) => {
    const settle = pending.get(result.id);
    if (settle) {
      pending.delete(result.id);
      settle(result);
    }
  });
}

/** Asks the window's renderer for one fix. Rejects with the reason; never logs a coordinate. */
function requestLocation(window: BrowserWindow | null): Promise<TrackerLocationInput> {
  if (window === null || window.isDestroyed()) {
    return Promise.reject(new Error('No tracker window to read the location from'));
  }
  const id = randomUUID();

  return new Promise<TrackerLocationInput>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error('Reading the location timed out'));
    }, TIMEOUT_MS);

    pending.set(id, (result) => {
      clearTimeout(timer);
      if (result.location === null) {
        reject(new Error(result.error ?? 'The location could not be read'));
        return;
      }
      resolve(result.location);
    });

    window.webContents.send(IPC.locationRequested, { id });
  });
}

/** The desktop's `LocationProvider`: the OS location service, through the tracker window. */
export function systemLocation(getWindow: () => BrowserWindow | null): LocationProvider {
  return { current: () => requestLocation(getWindow()) };
}
