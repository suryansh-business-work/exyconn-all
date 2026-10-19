import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';

/** Runs a provider credential check and reports the outcome either way. */
export function useConfigTest(check: (id: string) => Promise<string | undefined>) {
  const notify = useNotify();
  return async (row: { id: string }) => {
    try {
      notify((await check(row.id)) ?? 'The provider accepted the credentials', 'success');
    } catch (error) {
      portalLogger.warn('crm: an integration test failed', error);
      notify(errorMessage(error, 'The provider refused the credentials'), 'error');
    }
  };
}
