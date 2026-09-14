import type { ReactElement } from 'react';
import { Button, Checkbox, FormControlLabel, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import type { AppPreferences, UpdateState } from '@shared/types';
import { formatElapsed } from '@exyconn/tracker-core';
import { run } from '../run';
import { useAnnounce } from '../a11y/LiveAnnouncer';

interface Props {
  preferences: AppPreferences;
  update: UpdateState;
}

/**
 * What the app can say about a check that changed nothing.
 *
 * An up-to-date install ends a check in the same `idle` it started in, so without the
 * timestamp "I looked and you are current" is indistinguishable from "I never looked" —
 * which is exactly what made a Check button feel broken.
 */
function statusOf(update: UpdateState, t: ReturnType<typeof useT>): string {
  if (update.stage === 'checking') {
    return t('Looking for a newer version…');
  }
  if (update.stage === 'downloading') {
    return t('Downloading version {version} — {percent}%.', {
      version: update.version,
      percent: update.percent,
    });
  }
  if (update.stage === 'ready') {
    return t('Version {version} is ready, and installs the next time you quit.', {
      version: update.version,
    });
  }
  if (update.stage === 'available') {
    return t('Version {version} is available.', { version: update.version });
  }
  if (update.stage === 'failed') {
    return t('The last check could not reach the update service.');
  }
  if (update.lastCheckedAt === null) {
    return t('Not checked yet since this app started.');
  }
  const elapsed = formatElapsed(
    Date.now() - new Date(update.lastCheckedAt).getTime(),
  ).toLowerCase();
  return t('Up to date — checked {elapsed}.', { elapsed });
}

/**
 * Updates, and whether they arrive on their own.
 *
 * Two separate things, deliberately: updating automatically is a standing choice, and
 * checking NOW is a question ("is mine current?") that an app which only looks every six
 * hours could not answer. Neither installs anything mid-session.
 */
export default function UpdatePreference({ preferences, update }: Readonly<Props>): ReactElement {
  const t = useT();
  const busy = update.stage === 'checking' || update.stage === 'downloading';
  const status = statusOf(update, t);
  // The result of "Check for updates" appears below the button; say it where focus is.
  useAnnounce(status);

  return (
    <Stack spacing={1.5}>
      <Stack spacing={0.25}>
        <FormControlLabel
          sx={{ my: -0.5 }}
          control={
            <Checkbox
              checked={preferences.updateAutomatically}
              onChange={(event) =>
                run(() =>
                  window.tracker.setPreferences({ updateAutomatically: event.target.checked }),
                )
              }
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t('Update automatically')}
            </Typography>
          }
        />
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {preferences.updateAutomatically
            ? t(
                'New versions download in the background and install with a quick restart whenever you are not tracking.',
              )
            : t('You are told when a new version exists, and nothing is fetched until you ask.')}
        </Typography>
      </Stack>

      <Button
        variant="outlined"
        color="inherit"
        fullWidth
        startIcon={<RefreshRounded />}
        disabled={busy}
        onClick={() => run(() => window.tracker.checkForUpdate())}
      >
        {t('Check for updates')}
      </Button>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        {status}
      </Typography>
    </Stack>
  );
}
