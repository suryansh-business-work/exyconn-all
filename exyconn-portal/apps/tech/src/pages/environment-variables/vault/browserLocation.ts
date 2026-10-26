import { VaultLocationState, type VaultLocationInput } from '@exyconn/shell/graphql/generated';

/** Long enough for a laptop's Wi-Fi fix; never so long that unlocking feels stuck. */
const LOCATION_TIMEOUT_MS = 8000;

/**
 * Where the device is, as the browser reports it, for the unlock record. Asking never blocks
 * the unlock: a refusal or a machine without location is recorded as such instead.
 */
export function browserLocation(): Promise<VaultLocationInput> {
  const geolocation = globalThis.navigator?.geolocation;
  if (!geolocation) {
    return Promise.resolve({ state: VaultLocationState.Unavailable });
  }
  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (position) =>
        resolve({
          state: VaultLocationState.Granted,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      (error) =>
        resolve({
          state:
            error.code === error.PERMISSION_DENIED
              ? VaultLocationState.Denied
              : VaultLocationState.Unavailable,
        }),
      { enableHighAccuracy: false, timeout: LOCATION_TIMEOUT_MS, maximumAge: 60_000 },
    );
  });
}
