import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import {
  useResetUserPasswordMutation,
  useSetUserActiveMutation,
  useSetUserBlockedMutation,
} from '@/graphql/generated';

/**
 * Encapsulates the confirm-based admin actions for a single user (password
 * reset, activate/deactivate, unblock). Each handler confirms, mutates, then
 * refetches so the detail view reflects the new state.
 */
export function useUserActions(id: string, name: string, onChanged: () => void) {
  const confirm = useConfirm();
  const notify = useNotify();
  const [resetPassword] = useResetUserPasswordMutation();
  const [setActive] = useSetUserActiveMutation();
  const [setBlocked] = useSetUserBlockedMutation();

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      onChanged();
      notify(success);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Action failed', 'error');
    }
  };

  const handleResetPassword = async () => {
    const ok = await confirm({
      message: `Reset ${name}'s password and email the new credentials?`,
      confirmText: 'Reset & send',
    });
    if (!ok) return;
    await run(() => resetPassword({ variables: { id } }), 'New credentials emailed');
  };

  const handleToggleActive = async (isActive: boolean) => {
    const ok = await confirm({
      message: `${isActive ? 'Activate' : 'Deactivate'} ${name}?`,
      confirmText: isActive ? 'Activate' : 'Deactivate',
    });
    if (!ok) return;
    await run(
      () => setActive({ variables: { id, isActive } }),
      isActive ? 'User activated' : 'User deactivated',
    );
  };

  const handleUnblock = async () => {
    const ok = await confirm({ message: `Unblock ${name}?`, confirmText: 'Unblock' });
    if (!ok) return;
    await run(() => setBlocked({ variables: { id, isBlocked: false } }), 'User unblocked');
  };

  return { handleResetPassword, handleToggleActive, handleUnblock };
}
