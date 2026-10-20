import { useEffect } from 'react';
import type { LocationRequest, TrackerLocationInput } from '@shared/types';

/**
 * How long Chromium may take over one fix. Shorter than main's own wait (location-bridge.ts),
 * so a slow fix comes back with its reason instead of main's bare timeout.
 */
const FIX_TIMEOUT_MS = 15_000;

/** A fix this recent is still where the employee is — no need to wake the radio again. */
const MAX_FIX_AGE_MS = 60_000;

/** Reads one fix from the OS location service, through Chromium's geolocation. */
function readFix(): Promise<TrackerLocationInput> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyM: position.coords.accuracy,
          source: 'SYSTEM',
          capturedAt: new Date(position.timestamp).toISOString(),
        }),
      // The reason only (permission denied, unavailable, timeout) — never a coordinate.
      (error) => reject(new Error(`Geolocation failed (code ${error.code}): ${error.message}`)),
      { enableHighAccuracy: true, timeout: FIX_TIMEOUT_MS, maximumAge: MAX_FIX_AGE_MS },
    );
  });
}

/**
 * Answers the main process's location requests. Mounted at the root, beside the capture
 * bridge, because the five-minute move check fires whatever page is open — usually none, with
 * the app hidden in the tray. A failure is answered, not thrown, so main can explain it.
 */
export default function useLocationBridge(): void {
  useEffect(
    () =>
      globalThis.tracker.onLocationRequested((request: LocationRequest) => {
        readFix()
          .then((location) =>
            globalThis.tracker.sendLocationResult({ id: request.id, location, error: null }),
          )
          .catch((error: unknown) => {
            globalThis.tracker.sendLocationResult({
              id: request.id,
              location: null,
              error: error instanceof Error ? error.message : 'Geolocation failed.',
            });
          });
      }),
    [],
  );
}
