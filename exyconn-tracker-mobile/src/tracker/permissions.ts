import * as Notifications from 'expo-notifications';
import { PermissionsAndroid, Platform } from 'react-native';
import type { TrackerPermissions } from '@exyconn/tracker-core';
import { TrackerNative } from '../native/tracker-native';
import type { MobilePermissions, PermissionKind } from './types';

interface Snapshot {
  notifications: boolean;
  usageAccess: boolean;
  camera: boolean;
}

const IS_ANDROID = Platform.OS === 'android';

/**
 * The OS grants, as last read. The controller asks synchronously and the OS answers
 * asynchronously, so this snapshot is refreshed at launch, whenever the app comes back to the
 * foreground (the employee may have just flipped a switch in Settings), and after every request.
 */
let snapshot: Snapshot = { notifications: false, usageAccess: !IS_ANDROID, camera: !IS_ANDROID };

export async function refreshPermissionSnapshot(): Promise<void> {
  const notifications = (await Notifications.getPermissionsAsync()).granted;
  if (!IS_ANDROID) {
    snapshot = { notifications, usageAccess: true, camera: true };
    return;
  }
  snapshot = {
    notifications,
    usageAccess: TrackerNative?.hasUsageAccess() ?? false,
    camera: await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA),
  };
}

async function request(kind: PermissionKind): Promise<void> {
  if (kind === 'notifications') {
    await Notifications.requestPermissionsAsync();
  } else if (kind === 'usageAccess') {
    // There is no prompt for usage access — only its Settings page. The snapshot refreshes
    // when the employee comes back to the app.
    TrackerNative?.openUsageAccessSettings();
  } else {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
  }
  await refreshPermissionSnapshot();
}

/**
 * What the phone still needs. Camera only counts when the workspace has webcam capture on —
 * nobody is asked for a camera they will never be photographed with — and iOS reports usage
 * access and camera as granted because it can use neither for tracking.
 */
export const mobilePermissions: TrackerPermissions<MobilePermissions, PermissionKind> = {
  get(webcamEnabled) {
    const camera = !webcamEnabled || snapshot.camera;
    return {
      notifications: snapshot.notifications,
      usageAccess: snapshot.usageAccess,
      camera,
      allGranted: snapshot.notifications && snapshot.usageAccess && camera,
    };
  },
  request,
};

/** Whether the camera may be used right now — for the webcam photo and the service type. */
export function cameraGranted(): boolean {
  return snapshot.camera;
}
