import type { ReactElement } from 'react';
import { Button, Stack, Switch, Typography } from '@exyconn/ui';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import type { AppPreferences, UpdateState } from '@shared/types';
import { formatElapsed } from '../time';
import { run } from '../run';

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
function statusOf(update: UpdateState): string {
  if (update.stage === 'checking') {
    return 'Looking for a newer version…';
  }
  if (update.stage === 'downloading') {
    return `Downloading version ${update.version} — ${update.percent}%.`;
  }
  if (update.stage === 'ready') {
    return `Version ${update.version} is ready, and installs the next time you quit.`;
  }
  if (update.stage === 'available') {
    return `Version ${update.version} is available.`;
  }
  if (update.stage === 'failed') {
    return 'The last check could not reach the update service.';
  }
  if (update.lastCheckedAt === null) {
    return 'Not checked yet since this app started.';
  }
  return `Up to date — checked ${formatElapsed(Date.now() - new Date(update.lastCheckedAt).getTime()).toLowerCase()}.`;
}

/**
 * Updates, and whether they arrive on their own.
 *
 * Two separate things, deliberately: fetching in the background is a choice about somebody
 * else's connection, and checking NOW is a question ("is mine current?") that an app which
 * only looks every six hours could not answer. Neither installs anything mid-session — a
 * downloaded version waits for the employee's own next quit.
 */
export default function UpdatePreference({ preferences, update }: Readonly<Props>): ReactElement {
  const busy = update.stage === 'checking' || update.stage === 'downloading';

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={2} sx={{
        alignItems: "flex-start"
      }}>
        <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{
            fontWeight: 600
          }}>
            Download updates in the background
          </Typography>
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>
            {preferences.autoUpdate
              ? 'A new version is fetched as soon as it appears, and installs the next time you quit.'
              : 'You are told when a new version exists, and nothing is fetched until you ask.'}
          </Typography>
        </Stack>
        <Switch
          checked={preferences.autoUpdate}
          onChange={(event) =>
            run(() => window.tracker.setPreferences({ autoUpdate: event.target.checked }))
          }
          slotProps={{
            input: { 'aria-label': 'Download updates in the background' }
          }}
        />
      </Stack>

      <Button
        variant="outlined"
        color="inherit"
        fullWidth
        startIcon={<RefreshRounded />}
        disabled={busy}
        onClick={() => run(() => window.tracker.checkForUpdate())}
      >
        Check for updates
      </Button>
      <Typography variant="caption" sx={{
        color: "text.secondary"
      }}>
        {statusOf(update)}
      </Typography>
    </Stack>
  );
}
