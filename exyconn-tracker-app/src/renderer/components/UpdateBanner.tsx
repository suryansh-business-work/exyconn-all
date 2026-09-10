import type { ReactElement } from 'react';
import { useState } from 'react';
import { Alert, Button, LinearProgress, Stack, Typography } from '@exyconn/ui';
import type { UpdateState } from '@shared/types';
import { run } from '../run';

interface Props {
  update: UpdateState;
}

/**
 * The one line an update ever gets.
 *
 * It offers; it never blocks. There is no modal, no gate and no version check standing between
 * the employee and their own tracker — an app that stops someone working because a newer build
 * exists has decided their afternoon is worth less than its own version number.
 *
 * So: a new version says so and waits to be asked. Pressing Update starts the download in the
 * background, with a progress line and a fully usable app around it. When it lands it installs
 * itself on the next quit, whether or not anybody presses Restart.
 */
export default function UpdateBanner({ update }: Readonly<Props>): ReactElement | null {
  const [restarting, setRestarting] = useState(false);

  if (update.stage === 'available') {
    return (
      <UpdateNotice
        text={`Version ${update.version} is available.`}
        actionLabel="Update"
        onAction={() => run(() => window.tracker.downloadUpdate())}
      />
    );
  }

  if (update.stage === 'downloading') {
    return (
      <Stack sx={{ px: 2, pt: 1.5 }} spacing={0.5}>
        <Typography variant="caption" sx={{
          color: "text.secondary"
        }}>
          Downloading version {update.version} in the background — carry on working.
        </Typography>
        <LinearProgress variant="determinate" value={update.percent} />
      </Stack>
    );
  }

  if (update.stage === 'failed' && update.version !== '') {
    return (
      <UpdateNotice
        severity="warning"
        text={`Version ${update.version} could not be downloaded.`}
        actionLabel="Retry"
        onAction={() => run(() => window.tracker.downloadUpdate())}
      />
    );
  }

  if (update.stage !== 'ready') {
    return null;
  }

  return (
    <UpdateNotice
      text={`Version ${update.version} is ready. It installs the next time you quit.`}
      actionLabel="Restart"
      disabled={restarting}
      onAction={() => {
        setRestarting(true);
        window.tracker.installUpdate().catch((error: unknown) => {
          console.error('Could not restart into the new version', error);
          setRestarting(false);
        });
      }}
    />
  );
}

interface NoticeProps {
  text: string;
  actionLabel: string;
  onAction: () => void;
  severity?: 'info' | 'warning';
  disabled?: boolean;
}

/** One line and one button — the whole vocabulary an update is allowed here. */
function UpdateNotice({
  text,
  actionLabel,
  onAction,
  severity = 'info',
  disabled = false,
}: Readonly<NoticeProps>): ReactElement {
  return (
    <Alert
      severity={severity}
      sx={{ mx: 2, mt: 1.5 }}
      action={
        <Button size="small" onClick={onAction} disabled={disabled}>
          {actionLabel}
        </Button>
      }
    >
      {text}
    </Alert>
  );
}
