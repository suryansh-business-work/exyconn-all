import type { ReactElement } from 'react';
import { Alert, Button, Divider, Stack, TRACKER_RADIUS, Typography } from '@exyconn/ui';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import type { AppPreferences, Branding, TrackerSettings, WorkProfile } from '@shared/types';
import Surface from '../components/Surface';
import SettingsList from '../components/SettingsList';
import SignOutButton from '../components/SignOutButton';
import TimezonePicker from '../components/TimezonePicker';
import TrayPreference from '../components/TrayPreference';
import CaptureSoundPreference from '../components/CaptureSoundPreference';
import ThemeModePicker from '../components/ThemeModePicker';
import ProgressStylePicker from '../components/ProgressStylePicker';
import UpdatePreference from '../components/UpdatePreference';
import WorkArrangementCard from '../components/WorkArrangementCard';
import useAppVersion from '../hooks/useAppVersion';
import useUpdateState from '../hooks/useUpdateState';
import { buildSettingRows } from '../settings-rows';
import { run } from '../run';

interface Props {
  settings: TrackerSettings | null;
  branding: Branding | null;
  timezone: string;
  /** This install's own preferences — the employee's, not the administrator's. */
  preferences: AppPreferences;
  /** What HR contracted this employee to work — read-only here. */
  workProfile: WorkProfile | null;
}

/** Read-only view of what the workspace configured, plus the privacy + sign-out actions. */
export default function SettingsScreen({
  settings,
  branding,
  timezone,
  preferences,
  workProfile,
}: Readonly<Props>): ReactElement {
  const appVersion = useAppVersion();
  const update = useUpdateState();
  const supportEmail = branding?.supportEmail ?? '';
  const legalName = branding?.legalName ?? branding?.businessName ?? '';

  return (
    <Stack spacing={2}>
      {/* The one setting on this screen that is the EMPLOYEE'S, not the administrator's. */}
      <Surface sx={{ p: 2.5 }}>
        <Typography variant="h6">Your timezone</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mt: 0.5,
            mb: 2,
          }}
        >
          Your workspace sets a default. Pick your own if you work somewhere else.
        </Typography>
        <TimezonePicker timezone={timezone} />
      </Surface>

      {/* Also the employee's: it decides how this app behaves, never what it records. */}
      <Surface sx={{ p: 2.5 }}>
        <Typography variant="h6">This app</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mt: 0.5,
            mb: 2,
          }}
        >
          How the tracker behaves on this computer.
        </Typography>
        <TrayPreference preferences={preferences} />
        <Divider sx={{ my: 2 }} />
        <CaptureSoundPreference preferences={preferences} settings={settings} />
        <Divider sx={{ my: 2 }} />
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            mb: 1,
          }}
        >
          Appearance
        </Typography>
        <ThemeModePicker mode={preferences.themeMode} />
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            mt: 2,
            mb: 1,
          }}
        >
          Today’s progress
        </Typography>
        <ProgressStylePicker style={preferences.progressStyle} />
        <Divider sx={{ my: 2 }} />
        <UpdatePreference preferences={preferences} update={update} />
      </Surface>

      <WorkArrangementCard workProfile={workProfile} />

      <Surface sx={{ p: 2.5 }}>
        <Typography variant="h6">Settings</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mt: 0.5,
            mb: 1,
          }}
        >
          Configured by your workspace administrator in the Exyconn portal. This app cannot change
          them.
        </Typography>

        {settings === null ? (
          <Alert
            severity="info"
            variant="outlined"
            sx={{ borderRadius: `${TRACKER_RADIUS}px`, mt: 1 }}
          >
            Settings are not available right now.
          </Alert>
        ) : (
          <SettingsList rows={buildSettingRows(settings)} />
        )}
      </Surface>

      <Surface sx={{ p: 2.5 }}>
        <Typography variant="h6">Your data</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mt: 0.5,
            mb: 2,
          }}
        >
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
          {appVersion !== '' ? (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              Version {appVersion}
            </Typography>
          ) : null}
          {legalName !== '' ? (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              {legalName}
            </Typography>
          ) : null}
          {supportEmail !== '' ? (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              Support: {supportEmail}
            </Typography>
          ) : null}
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
            }}
          >
            Keystrokes and clicks are counted, never recorded. Nothing is captured while tracking is
            stopped or paused.
          </Typography>
        </Stack>
      </Surface>
    </Stack>
  );
}
