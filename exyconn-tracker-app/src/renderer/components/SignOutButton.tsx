import type { ReactElement } from 'react';
import { Alert, Button, Stack, TRACKER_RADIUS } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import usePendingAction from '../hooks/usePendingAction';
import { useAnnounce } from '../a11y/LiveAnnouncer';
import { run } from '../run';

/**
 * Sign out. The main process stops tracking and flushes the outbox BEFORE dropping the token,
 * so the wait is a real upload — show it as one instead of a frozen button. On success the
 * main process publishes `signed-out` and this screen unmounts; a failure is said here.
 */
export default function SignOutButton(): ReactElement {
  const t = useT();
  const { pending, error, perform } = usePendingAction<'sign-out'>();
  const busy = pending !== null;
  useAnnounce(error, 'assertive');

  return (
    <Stack spacing={1}>
      <Button
        variant="outlined"
        color="inherit"
        fullWidth
        loading={busy}
        loadingPosition="start"
        startIcon={<LogoutRounded />}
        onClick={() =>
          run(() =>
            perform(
              'sign-out',
              () => globalThis.tracker.logout(),
              t('Sign out did not finish. Try again.'),
            ),
          )
        }
      >
        {busy ? t('Syncing your work…') : t('Sign out')}
      </Button>
      {error !== null && (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
          {error}
        </Alert>
      )}
    </Stack>
  );
}
