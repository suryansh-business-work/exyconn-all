import { describe, expect, it, vi } from 'vitest';
import {
  cameraGranted,
  mobilePermissions,
  refreshPermissionSnapshot,
} from '../../../src/tracker/permissions';
import { PermissionsAndroid } from '../mocks/react-native/apis';

const native = vi.hoisted(() => ({
  hasUsageAccess: vi.fn(() => false),
  openUsageAccessSettings: vi.fn(),
}));

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<{ Platform: Record<string, unknown> }>();
  return { ...actual, Platform: { ...actual.Platform, OS: 'android' } };
});
vi.mock('../../../src/native/tracker-native', () => ({
  TrackerNative: native,
  KEEP_ALIVE_TASK: 'ExyconnTrackerKeepAlive',
}));

describe('mobilePermissions on Android', () => {
  it('assumes nothing is granted until the OS has been asked', () => {
    expect(mobilePermissions.get(true)).toEqual({
      notifications: false,
      usageAccess: false,
      camera: false,
      allGranted: false,
    });
    expect(cameraGranted()).toBe(false);
  });

  it('only counts the camera as needed when the workspace takes photos', () => {
    expect(mobilePermissions.get(false).camera).toBe(true);
    expect(mobilePermissions.get(true).camera).toBe(false);
  });

  it('reads usage access from the native module and the camera from the OS', async () => {
    native.hasUsageAccess.mockReturnValue(true);
    vi.mocked(PermissionsAndroid.check).mockResolvedValue(true);
    await refreshPermissionSnapshot();
    expect(PermissionsAndroid.check).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.CAMERA);
    expect(mobilePermissions.get(true)).toEqual({
      notifications: true,
      usageAccess: true,
      camera: true,
      allGranted: true,
    });
    expect(cameraGranted()).toBe(true);
  });

  it('keeps usage access missing while the employee has not switched it on', async () => {
    native.hasUsageAccess.mockReturnValue(false);
    vi.mocked(PermissionsAndroid.check).mockResolvedValue(true);
    await refreshPermissionSnapshot();
    expect(mobilePermissions.get(false)).toMatchObject({ usageAccess: false, allGranted: false });
  });

  it('opens the usage-access Settings page, which has no prompt', async () => {
    await mobilePermissions.request('usageAccess');
    expect(native.openUsageAccessSettings).toHaveBeenCalledTimes(1);
  });

  it('prompts for the camera and re-reads the answer', async () => {
    native.hasUsageAccess.mockReturnValue(true);
    vi.mocked(PermissionsAndroid.check).mockResolvedValue(false);
    await mobilePermissions.request('camera');
    expect(PermissionsAndroid.request).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.CAMERA);
    expect(cameraGranted()).toBe(false);
    expect(mobilePermissions.get(true).allGranted).toBe(false);
  });
});
