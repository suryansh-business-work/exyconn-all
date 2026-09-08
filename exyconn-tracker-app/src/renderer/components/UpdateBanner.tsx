import type { ReactElement } from 'react';
import { useState } from 'react';
import { Alert, Button, LinearProgress, Stack, Typography } from '@exyconn/ui';
import type { UpdateState } from '@shared/types';

interface Props {
  update: UpdateState;
}

/**
 * The one line an update ever gets.
 *
 * Downloading says so and gets on with it; only a version already on disk asks for
 * anything, and even then the app installs it on the next quit whether or not the
 * employee presses Restart. Nothing here can interrupt tracking.
 */
export default function UpdateBanner({ update }: Readonly<Props>): ReactElement | null {
  const [restarting, setRestarting] = useState(false);

  function restart(): void {
    setRestarting(true);
    window.tracker.installUpdate().catch((error: unknown) => {
      console.error('Could not restart into the new version', error);
      setRestarting(false);
    });
  }

  if (update.stage === 'downloading') {
    return (
      <Stack sx={{ px: 2, pt: 1.5 }} spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          Downloading version {update.version}…
        </Typography>
        <LinearProgress variant="determinate" value={update.percent} />
      </Stack>
    );
  }

  if (update.stage !== 'ready') {
    return null;
  }

  return (
    <Alert
      severity="info"
      sx={{ mx: 2, mt: 1.5 }}
      action={
        <Button size="small" onClick={restart} disabled={restarting}>
          Restart
        </Button>
      }
    >
      Version {update.version} is ready. It installs the next time you quit.
    </Alert>
  );
}
