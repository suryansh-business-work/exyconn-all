import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { getCalendars, getLocales } from 'expo-localization';
import { Dimensions, Platform } from 'react-native';
import { deviceTimezone, type DeviceInfo } from '@exyconn/tracker-core';
import { mobileStore } from './store';

const BYTES_PER_MB = 1024 * 1024;

/**
 * A stable hardware identifier: Android's ANDROID_ID (per app-signing key, survives reinstalls)
 * or iOS's identifierForVendor. Distinct from `deviceId`, which is per install — the machine id
 * is what keeps one phone recognisable in the Devices console across reinstalls.
 */
async function readMachineId(): Promise<string> {
  if (Platform.OS === 'android') {
    return Application.getAndroidId();
  }
  return (await Application.getIosIdForVendorAsync()) ?? '';
}

let cached: DeviceInfo | null = null;

/**
 * Reads everything the portal records about this phone, once, at launch — the iOS vendor id is
 * async and the controller asks for device info synchronously. A field a phone cannot know (CPU
 * cores) is sent as 0 rather than invented.
 */
export async function loadDeviceInfo(): Promise<void> {
  const screen = Dimensions.get('screen');
  cached = {
    deviceId: mobileStore().deviceId,
    platform: Platform.OS,
    hostname: Device.deviceName ?? '',
    appVersion: Application.nativeApplicationVersion ?? '',
    machineId: await readMachineId(),
    osName: Device.osName ?? Platform.OS,
    osVersion: Device.osVersion ?? '',
    arch: Device.supportedCpuArchitectures?.[0] ?? '',
    cpuModel: Device.modelName ?? '',
    cpuCores: 0,
    totalMemoryMb: Math.round((Device.totalMemory ?? 0) / BYTES_PER_MB),
    locale: getLocales()[0]?.languageTag ?? '',
    timezone: getCalendars()[0]?.timeZone ?? deviceTimezone(),
    screenCount: 1,
    screenResolution: `${Math.round(screen.width * screen.scale)}x${Math.round(screen.height * screen.scale)}`,
  };
}

export function deviceInfo(): DeviceInfo {
  if (cached === null) {
    throw new Error('Device info was read before the app finished starting.');
  }
  return cached;
}

/** The same, or null before launch has read it — for the logger, which must never throw. */
export function loadedDeviceInfo(): DeviceInfo | null {
  return cached;
}
