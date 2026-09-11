import type { IconName } from '../../components/ui/Icon';
import type { Capabilities, MobilePermissions, PermissionKind } from '../../tracker/types';

/** One grant the phone still needs: what it is, why, and what the button does. */
export interface PermissionInfo {
  kind: PermissionKind;
  title: string;
  reason: string;
  icon: IconName;
  /** "Allow" raises the OS prompt; usage access has no prompt, only a Settings page. */
  actionLabel: string;
}

/** What the tracker does on its own, and tells the employee about — on every phone. */
const OWN_ACTIONS =
  'anything the tracker does on its own — a pause, the end of your working day — and every message your workspace sends you';

/** Why notifications are needed, on a phone that takes screenshots and on one that cannot. */
function notificationsReason(capabilities: Capabilities): string {
  if (capabilities.screenshots) {
    return `Every screenshot is announced by a notification the moment it is taken — the tracker captures nothing it cannot tell you about — and so is ${OWN_ACTIONS}.`;
  }
  return `So you are told about ${OWN_ACTIONS}.`;
}

const OTHER_PERMISSIONS: readonly PermissionInfo[] = [
  // Android only: iOS reports it granted, because an iPhone has no such setting to give.
  {
    kind: 'usageAccess',
    title: 'Usage access',
    reason:
      'Shows which app is in front, and for how long — never what is on it. Android has no prompt for this: the button opens Settings, where you switch the tracker on and come back.',
    icon: 'apps',
    actionLabel: 'Open Settings',
  },
  // Only ever missing when the workspace has turned webcam capture on; `permissions.camera`
  // reports granted otherwise, so nobody is asked for a camera that will never be used.
  {
    kind: 'camera',
    title: 'Camera',
    reason:
      'Your workspace takes a photo with the front camera with each screenshot. Every one is announced, and shows in the notification.',
    icon: 'camera-outline',
    actionLabel: 'Allow',
  },
];

/** The grants still missing, in the order they are best asked for. */
export function missingPermissions(
  permissions: MobilePermissions,
  capabilities: Capabilities,
): PermissionInfo[] {
  const notifications: PermissionInfo = {
    kind: 'notifications',
    title: 'Notifications',
    reason: notificationsReason(capabilities),
    icon: 'bell-outline',
    actionLabel: 'Allow',
  };
  return [notifications, ...OTHER_PERMISSIONS].filter((row) => !permissions[row.kind]);
}
