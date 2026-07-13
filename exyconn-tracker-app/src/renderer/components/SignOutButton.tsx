import { useState } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import { run } from '../run';

/**
 * Sign out. The main process stops tracking and flushes the outbox BEFORE dropping the token,
 * so the wait is a real upload — show it as one instead of a frozen button.
 */
export default function SignOutButton(): JSX.Element {
  const [busy, setBusy] = useState(false);

  async function signOut(): Promise<void> {
    setBusy(true);
    try {
      await window.tracker.logout();
      // On success the main process publishes `signed-out` and this screen unmounts.
    } catch (cause: unknown) {
      console.error('Sign out failed', cause);
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outlined"
      color="inherit"
      fullWidth
      disabled={busy}
      startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <LogoutRounded />}
      onClick={() => run(signOut)}
    >
      {busy ? 'Syncing your work…' : 'Sign out'}
    </Button>
  );
}
