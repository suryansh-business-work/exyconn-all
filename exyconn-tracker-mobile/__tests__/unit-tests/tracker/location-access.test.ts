import { describe, expect, it, vi } from 'vitest';
import * as Location from 'expo-location';
import {
  openLocationSettings,
  readLocationAccess,
  requestLocationAccess,
} from '../../../src/tracker/location-access';
import { Linking, Platform } from '../mocks/react-native/apis';

type Permission = Awaited<ReturnType<typeof Location.getForegroundPermissionsAsync>>;

function permission(granted: boolean, canAskAgain: boolean): Permission {
  return { granted, canAskAgain, status: granted ? 'granted' : 'denied' } as Permission;
}

describe('readLocationAccess', () => {
  it('is on when the app may ask and location services are on', async () => {
    await expect(readLocationAccess()).resolves.toEqual({ status: 'on' });
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('is off as denied, saying whether the OS will still prompt', async () => {
    vi.mocked(Location.getForegroundPermissionsAsync).mockResolvedValueOnce(
      permission(false, true),
    );
    await expect(readLocationAccess()).resolves.toEqual({
      status: 'off',
      reason: 'denied',
      canAsk: true,
    });

    vi.mocked(Location.getForegroundPermissionsAsync).mockResolvedValueOnce(
      permission(false, false),
    );
    await expect(readLocationAccess()).resolves.toEqual({
      status: 'off',
      reason: 'denied',
      canAsk: false,
    });
  });

  it('is off as services off when access is granted but the phone’s location is off', async () => {
    vi.mocked(Location.hasServicesEnabledAsync).mockResolvedValueOnce(false);
    await expect(readLocationAccess()).resolves.toEqual({
      status: 'off',
      reason: 'servicesOff',
      canAsk: false,
    });
  });
});

describe('requestLocationAccess', () => {
  it('shows the OS prompt for foreground access', async () => {
    await requestLocationAccess();
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});

describe('openLocationSettings', () => {
  it('opens Android’s location settings page', async () => {
    Platform.OS = 'android';
    await openLocationSettings();
    expect(Linking.sendIntent).toHaveBeenCalledWith('android.settings.LOCATION_SOURCE_SETTINGS');
    expect(Linking.openSettings).not.toHaveBeenCalled();
  });

  it('opens this app’s own settings page on iOS', async () => {
    await openLocationSettings();
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
    expect(Linking.sendIntent).not.toHaveBeenCalled();
  });
});
