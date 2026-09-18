import { useCallback } from 'react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

/**
 * Runs a one-click action — mark done, provision, revoke — tells the person how it went, and
 * refreshes whatever shows the result. Failures are shown, never swallowed.
 */
export function useRunAction(refresh: () => unknown) {
  const notify = useNotify();
  return useCallback(
    async (action: () => Promise<unknown>, success: string) => {
      try {
        await action();
        notify(success);
        refresh();
      } catch (error) {
        notify(errorMessage(error, 'That did not work'), 'error');
      }
    },
    [notify, refresh],
  );
}
