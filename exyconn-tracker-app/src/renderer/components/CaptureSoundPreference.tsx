import type { ReactElement } from 'react';
import { Stack, Switch, Typography } from '@exyconn/ui';
import type { AppPreferences, TrackerSettings } from '@shared/types';
import { run } from '../run';

interface Props {
  preferences: AppPreferences;
  /** Null until the portal has answered; the workspace's own mute lives here. */
  settings: TrackerSettings | null;
}

/**
 * Mutes the camera shutter on THIS computer.
 *
 * Being on a call next to a tracker firing a shutter every few minutes should not need an
 * administrator to fix, so this is the employee's own switch. It silences and nothing more:
 * the capture notification still appears on every capture, so muting can never become a way
 * of being screenshotted without knowing.
 *
 * When the workspace has already muted captures for everyone there is nothing left for this
 * switch to silence, and it says so rather than pretending to be in charge.
 */
export default function CaptureSoundPreference({
  preferences,
  settings,
}: Readonly<Props>): ReactElement {
  const mutedByWorkspace = settings !== null && !settings.captureSoundEnabled;
  const caption = describe(mutedByWorkspace, preferences.muteCaptureSound);

  return (
    <Stack direction="row" spacing={2} sx={{
      alignItems: "flex-start"
    }}>
      <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{
          fontWeight: 600
        }}>
          Mute the screenshot sound
        </Typography>
        <Typography variant="caption" sx={{
          color: "text.secondary"
        }}>
          {caption}
        </Typography>
      </Stack>
      <Switch
        checked={preferences.muteCaptureSound}
        disabled={mutedByWorkspace}
        inputProps={{ 'aria-label': 'Mute the camera shutter on this computer' }}
        onChange={(event) =>
          run(() => window.tracker.setPreferences({ muteCaptureSound: event.target.checked }))
        }
      />
    </Stack>
  );
}

/** What the switch is actually doing right now, in the employee's own terms. */
function describe(mutedByWorkspace: boolean, muted: boolean): string {
  if (mutedByWorkspace) {
    return 'Your workspace has already turned the capture sound off for everyone. You still get a notification for every screenshot.';
  }
  if (muted) {
    return 'Screenshots are taken silently on this computer. You still get a notification for every one.';
  }
  return 'A camera shutter plays each time a screenshot is taken. Muting it changes nothing about what is captured.';
}
