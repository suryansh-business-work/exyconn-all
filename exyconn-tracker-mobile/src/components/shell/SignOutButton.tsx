import { useState } from 'react';
import { YStack } from 'tamagui';
import type { TrackerStatus } from '@exyconn/tracker-core';
import { signOutMessage } from '../../lib/session/sign-out';
import { tracker } from '../../tracker/instance';
import { messageOf } from '../../tracker/run';
import { AppButton } from '../ui/AppButton';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Notice } from '../ui/Notice';

interface Props {
  status: TrackerStatus;
  /** Items still in the outbox — sign-out uploads them before the token goes. */
  pendingSync: number;
}

const SIGN_OUT_FAILED = 'Sign out did not finish. Try again.';

/**
 * Sign out, behind a confirmation that says what the desktop's close guard would: a running
 * session, and work still waiting to upload. The controller stops tracking and flushes the
 * outbox BEFORE dropping the token, so the wait is a real upload — shown as one.
 */
export function SignOutButton({ status, pendingSync }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await tracker.logout();
      // On success the state turns `signed-out` and the root layout leaves this screen.
    } catch (cause: unknown) {
      console.error('Sign out failed', cause);
      setError(messageOf(cause, SIGN_OUT_FAILED));
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <YStack gap="$2">
      <AppButton
        label="Sign out"
        tone="outlined"
        icon="logout"
        danger
        full
        onPress={() => setOpen(true)}
      />
      {error === null ? null : <Notice severity="error">{error}</Notice>}
      <ConfirmDialog
        open={open}
        title="Sign out?"
        message={signOutMessage(status, pendingSync)}
        confirmLabel={busy ? 'Syncing your work…' : 'Sign out'}
        danger
        busy={busy}
        onConfirm={() => {
          signOut().catch((cause: unknown) => console.error('Sign out failed', cause));
        }}
        onCancel={() => setOpen(false)}
      />
    </YStack>
  );
}
