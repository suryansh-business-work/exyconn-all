import * as Notifications from 'expo-notifications';
import { describe, expect, it, vi } from 'vitest';
import {
  cameraGranted,
  mobilePermissions,
  refreshPermissionSnapshot,
} from '../../../src/tracker/permissions';
import { PermissionsAndroid } from '../mocks/react-native/apis';

/** iOS (the stubs' default platform): no usage access or camera to ask for. */
describe('mobilePermissions on iOS', () => {
  it('starts with notifications unknown, and usage access and camera granted', () => {
    expect(mobilePermissions.get(true)).toEqual({
      notifications: false,
      usageAccess: true,
      camera: true,
      allGranted: false,
    });
    expect(cameraGranted()).toBe(true);
  });

  it('reads the notification grant and counts everything granted', async () => {
    await refreshPermissionSnapshot();
    expect(mobilePermissions.get(true)).toEqual({
      notifications: true,
      usageAccess: true,
      camera: true,
      allGranted: true,
    });
    expect(PermissionsAndroid.check).not.toHaveBeenCalled();
  });

  it('reports a refused notification grant as still missing', async () => {
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce({
      granted: false,
      status: 'denied',
    } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);
    await refreshPermissionSnapshot();
    expect(mobilePermissions.get(false)).toMatchObject({ notifications: false, allGranted: false });
  });

  it('asks the OS for notifications, then re-reads the grants', async () => {
    await mobilePermissions.request('notifications');
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mobilePermissions.get(false).notifications).toBe(true);
  });

  it('asks for the camera through Android’s prompt API when asked for it', async () => {
    await mobilePermissions.request('camera');
    expect(PermissionsAndroid.request).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.CAMERA);
  });

  it('has no usage-access page to open without the native module', async () => {
    await expect(mobilePermissions.request('usageAccess')).resolves.toBeUndefined();
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
