import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import type { AppPreferences } from '@shared/types';
import { run } from '../run';

interface Props {
  preferences: AppPreferences;
}

/**
 * What the close button does. On: the window hides and the tracker keeps running in the tray,
 * which is how it is meant to be used — the tray icon and menu stay the visible indicator
 * that it is still recording. Off: close means quit, and tracking stops with the app.
 */
export default function TrayPreference({ preferences }: Readonly<Props>): JSX.Element {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600}>
          Keep running in the tray
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {preferences.closeToTray
            ? 'Closing the window hides it. Tracking carries on, and the tray icon stays as the reminder.'
            : 'Closing the window quits the tracker, and tracking stops with it.'}
        </Typography>
      </Stack>
      <Switch
        checked={preferences.closeToTray}
        inputProps={{ 'aria-label': 'Keep running in the tray when the window is closed' }}
        onChange={(event) =>
          run(() => window.tracker.setPreferences({ closeToTray: event.target.checked }))
        }
      />
    </Stack>
  );
}
