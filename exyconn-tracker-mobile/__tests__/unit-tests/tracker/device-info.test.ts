import { describe, expect, it, vi } from 'vitest';
import { deviceInfo, loadDeviceInfo, loadedDeviceInfo } from '../../../src/tracker/device-info';
import * as Application from '../mocks/expo-application';
import { getCalendars, getLocales } from '../mocks/expo-localization';
import { Platform } from '../mocks/react-native/apis';

vi.mock('../../../src/tracker/store', () => ({
  mobileStore: () => ({ deviceId: 'install-1' }),
}));

describe('device info', () => {
  it('is not there to read before launch has loaded it', () => {
    expect(loadedDeviceInfo()).toBeNull();
    expect(() => deviceInfo()).toThrow('Device info was read before the app finished starting.');
  });

  it('describes an iPhone, identified by its vendor id', async () => {
    await loadDeviceInfo();
    expect(deviceInfo()).toEqual({
      deviceId: 'install-1',
      platform: 'ios',
      hostname: 'Test Phone',
      appVersion: '1.0.0',
      machineId: 'ios-id',
      osName: 'iOS',
      osVersion: '17.0',
      arch: 'arm64',
      cpuModel: 'iPhone',
      cpuCores: 0,
      totalMemoryMb: 4096,
      locale: 'en-US',
      timezone: 'UTC',
      screenCount: 1,
      screenResolution: '1170x2532',
    });
    expect(loadedDeviceInfo()).toBe(deviceInfo());
  });

  it('sends an empty machine id when iOS withholds the vendor id', async () => {
    Application.getIosIdForVendorAsync.mockResolvedValueOnce(null);
    await loadDeviceInfo();
    expect(deviceInfo().machineId).toBe('');
  });

  it('identifies an Android phone by its ANDROID_ID', async () => {
    Platform.OS = 'android';
    await loadDeviceInfo();
    expect(deviceInfo()).toMatchObject({ platform: 'android', machineId: 'android-id' });
    expect(Application.getIosIdForVendorAsync).not.toHaveBeenCalled();
  });

  it('leaves the locale blank and falls back to the device zone when the OS gives none', async () => {
    getLocales.mockReturnValueOnce([]);
    getCalendars.mockReturnValueOnce([{ timeZone: null }]);
    await loadDeviceInfo();
    expect(deviceInfo().locale).toBe('');
    expect(deviceInfo().timezone).toEqual(expect.any(String));
    expect(deviceInfo().timezone).not.toBe('');
  });
});
