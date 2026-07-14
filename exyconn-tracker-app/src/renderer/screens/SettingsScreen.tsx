import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import type { Branding, TrackerSettings } from '@shared/types';
import Surface from '../components/Surface';
import SettingsList from '../components/SettingsList';
import SignOutButton from '../components/SignOutButton';
import { buildSettingRows } from '../settings-rows';
import { run } from '../run';

interface Props {
  settings: TrackerSettings | null;
  branding: Branding | null;
}

/** Read-only view of what the workspace configured, plus the privacy + sign-out actions. */
export default function SettingsScreen({ settings, branding }: Readonly<Props>): JSX.Element {
  const supportEmail = branding?.supportEmail ?? '';
  const legalName = branding?.legalName ?? branding?.businessName ?? '';

  return (
    <Stack spacing={2}>
      <Surface sx={{ p: 2.5 }}>
        <Typography variant="h6">Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
          Configured by your workspace administrator in the Exyconn portal. This app cannot change
          them.
        </Typography>

        {settings === null ? (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: '4px', mt: 1 }}>
            Settings are not available right now.
          </Alert>
        ) : (
          <SettingsList rows={buildSettingRows(settings)} />
        )}
      </Surface>

      <Surface sx={{ p: 2.5 }}>
        <Typography variant="h6">Your data</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Everything this app has recorded about you is visible to you in the portal.
        </Typography>
        <Stack spacing={1.25}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<OpenInNewRounded />}
            onClick={() => run(() => window.tracker.openPrivacy())}
          >
            View my data in the portal
          </Button>
          <SignOutButton />
        </Stack>
      </Surface>

      <Surface sx={{ p: 2.5 }}>
        <Typography variant="h6">About</Typography>
        <Divider sx={{ my: 1.5 }} />
        <Stack spacing={0.5}>
          {legalName !== '' ? (
            <Typography variant="body2" color="text.secondary">
              {legalName}
            </Typography>
          ) : null}
          {supportEmail !== '' ? (
            <Typography variant="body2" color="text.secondary">
              Support: {supportEmail}
            </Typography>
          ) : null}
          <Typography variant="caption" color="text.secondary">
            Keystrokes and clicks are counted, never recorded. Nothing is captured while tracking is
            stopped or paused.
          </Typography>
        </Stack>
      </Surface>
    </Stack>
  );
}
