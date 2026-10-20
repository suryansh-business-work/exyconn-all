import { useCallback } from 'react';
import type { Interpolations } from '@exyconn/i18n';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

/**
 * Runs a mutation and tells the person how it went: the success sentence, or the server's own
 * reason it failed. Resolves to whether it succeeded, so a form can close or stay open.
 */
export function useRunNotified() {
  const notify = useNotify();
  return useCallback(
    async (run: () => Promise<unknown>, success: string, values?: Interpolations) => {
      try {
        await run();
        notify(success, 'success', values);
        return true;
      } catch (error) {
        notify(errorMessage(error, 'Something went wrong. Try again.'), 'error');
        return false;
      }
    },
    [notify],
  );
}
