import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
import type { LocationAccess } from '@exyconn/tracker-core';

/**
 * Location access on this phone: the app's foreground permission and whether the phone's
 * location services are on at all. Only foreground access, as `gpsLocation` asks for — and no
 * fix is read here, so no coordinate exists on this path.
 */

/** Reads the current state without prompting. */
export async function readLocationAccess(): Promise<LocationAccess> {
  const [permission, servicesOn] = await Promise.all([
    Location.getForegroundPermissionsAsync(),
    Location.hasServicesEnabledAsync(),
  ]);
  if (!permission.granted) {
    return { status: 'off', reason: 'denied', canAsk: permission.canAskAgain };
  }
  if (!servicesOn) {
    return { status: 'off', reason: 'servicesOff', canAsk: false };
  }
  return { status: 'on' };
}

/** Shows the OS's own location prompt. Resolves once the employee has answered it. */
export async function requestLocationAccess(): Promise<void> {
  await Location.requestForegroundPermissionsAsync();
}

/**
 * Opens where location is switched on: Android's location settings page; on iOS, which lets
 * an app open only its own settings page, this app's page (its Location row is there).
 */
export async function openLocationSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
    return;
  }
  await Linking.openSettings();
}
