import type { ReactElement } from 'react';
import { useState } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import { Button, Stack, Typography } from '@exyconn/ui';
import AccessibilityNewOutlined from '@mui/icons-material/AccessibilityNewOutlined';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import ScreenshotMonitorOutlined from '@mui/icons-material/ScreenshotMonitorOutlined';
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import type { PermissionKind, PermissionState } from '@shared/types';
import Surface from '../components/Surface';
import PermissionRow from '../components/PermissionRow';
import ScreenLayout from '../components/ScreenLayout';
import { run } from '../run';

interface PermissionInfo {
  kind: PermissionKind;
  title: string;
  reason: string;
  icon: SvgIconComponent;
}

const PERMISSIONS: readonly PermissionInfo[] = [
  {
    kind: 'screenRecording',
    title: 'Screen Recording',
    reason: 'Lets the app capture periodic screenshots and read the active window title.',
    icon: ScreenshotMonitorOutlined,
  },
  {
    kind: 'accessibility',
    title: 'Accessibility',
    reason: 'Lets the app count keyboard and mouse activity — how often, never what you type.',
    icon: AccessibilityNewOutlined,
  },
  // Only ever missing when the workspace has turned webcam capture on; `permissions.camera`
  // reports granted otherwise, so nobody is asked for a camera that will never be used.
  {
    kind: 'camera',
    title: 'Camera',
    reason:
      'Your workspace takes a webcam photo with each screenshot. Every one is announced, and shows in the notification.',
    icon: PhotoCameraOutlined,
  },
];

interface Props {
  permissions: PermissionState;
}

/** macOS-only screen prompting for the TCC grants the tracker still needs. */
export default function PermissionsScreen({ permissions }: Readonly<Props>): ReactElement {
  const [busy, setBusy] = useState(false);
  const missing = PERMISSIONS.filter((row) => !permissions[row.kind]);

  async function grant(kind: PermissionKind): Promise<void> {
    setBusy(true);
    try {
      await window.tracker.requestPermission(kind);
    } catch (cause: unknown) {
      console.error('Failed to request permission', cause);
    } finally {
      setBusy(false);
    }
  }

  async function recheck(): Promise<void> {
    setBusy(true);
    try {
      await window.tracker.getPermissions();
    } catch (cause: unknown) {
      console.error('Failed to re-check permissions', cause);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenLayout maxWidth={520}>
      <Surface sx={{ p: 3 }}>
        <Typography variant="h5">Grant permissions</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          macOS needs your permission before the tracker can work. Grant each item below, then
          re-check.
        </Typography>

        <Stack spacing={1.5}>
          {missing.map((row) => (
            <PermissionRow
              key={row.kind}
              title={row.title}
              reason={row.reason}
              icon={row.icon}
              busy={busy}
              onGrant={() => run(() => grant(row.kind))}
            />
          ))}
        </Stack>

        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          startIcon={<RefreshRounded />}
          disabled={busy}
          sx={{ mt: 2.5 }}
          onClick={() => run(recheck)}
        >
          Re-check
        </Button>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
          Some features will not work until these are granted.
        </Typography>
      </Surface>
    </ScreenLayout>
  );
}
