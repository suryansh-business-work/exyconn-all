import type { ReactElement } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import { Alert, Button, Stack, TRACKER_RADIUS, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import AccessibilityNewOutlined from '@mui/icons-material/AccessibilityNewOutlined';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import ScreenshotMonitorOutlined from '@mui/icons-material/ScreenshotMonitorOutlined';
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import type { PermissionKind, PermissionState } from '@shared/types';
import Surface from '../components/Surface';
import PermissionRow from '../components/PermissionRow';
import ScreenLayout from '../components/ScreenLayout';
import { run } from '../run';
import usePendingAction from '../hooks/usePendingAction';
import { useAnnounce } from '../a11y/LiveAnnouncer';

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
  const t = useT();
  const { pending, error, perform } = usePendingAction<PermissionKind | 'recheck'>();
  const busy = pending !== null;
  useAnnounce(error, 'assertive');
  const missing = PERMISSIONS.filter((row) => !permissions[row.kind]);

  const grant = (kind: PermissionKind): Promise<boolean> =>
    perform(
      kind,
      () => globalThis.tracker.requestPermission(kind),
      t('macOS did not answer the request. Try again, or allow it in System Settings.'),
    );
  const recheck = (): Promise<boolean> =>
    perform(
      'recheck',
      () => globalThis.tracker.getPermissions(),
      t('Could not re-check the permissions. Try again.'),
    );

  return (
    <ScreenLayout maxWidth={520}>
      <Surface sx={{ p: 3 }}>
        <Typography variant="h5" component="h1">
          {t('Grant permissions')}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mt: 0.5,
            mb: 2,
          }}
        >
          {t(
            'macOS needs your permission before the tracker can work. Grant each item below, then re-check.',
          )}
        </Typography>

        {error !== null && (
          <Alert
            severity="error"
            variant="outlined"
            sx={{ borderRadius: `${TRACKER_RADIUS}px`, mb: 1.5 }}
          >
            {error}
          </Alert>
        )}

        <Stack spacing={1.5}>
          {missing.map((row) => (
            <PermissionRow
              key={row.kind}
              title={t(row.title)}
              reason={t(row.reason)}
              icon={row.icon}
              busy={busy}
              loading={pending === row.kind}
              onGrant={() => run(() => grant(row.kind))}
            />
          ))}
        </Stack>

        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          startIcon={<RefreshRounded />}
          loading={pending === 'recheck'}
          disabled={busy}
          sx={{ mt: 2.5 }}
          onClick={() => run(recheck)}
        >
          {t('Re-check')}
        </Button>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            mt: 1.5,
          }}
        >
          {t('Some features will not work until these are granted.')}
        </Typography>
      </Surface>
    </ScreenLayout>
  );
}
