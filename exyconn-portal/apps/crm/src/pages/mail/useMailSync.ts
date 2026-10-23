import { useCallback, useEffect } from 'react';
import {
  CrmMailOverviewDocument,
  CrmMailThreadsDocument,
  useSyncCrmMailMutation,
} from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';

/**
 * Reads the newest mail from Gmail when CRM > Mail opens (and when another mailbox is chosen),
 * and on "Sync now". The server syncs a mailbox at most every 30 seconds, so opening the page
 * often costs Gmail nothing. Each mailbox that failed comes back with what to do about it.
 */
export function useMailSync(accountId: string, enabled: boolean) {
  const [syncMail, { data, loading, error }] = useSyncCrmMailMutation({
    refetchQueries: [CrmMailOverviewDocument, CrmMailThreadsDocument],
  });
  const sync = useCallback(() => {
    syncMail({ variables: { accountId: accountId || null } }).catch((reason: unknown) =>
      portalLogger.warn('crm: syncing mail failed', reason),
    );
  }, [syncMail, accountId]);

  useEffect(() => {
    if (enabled) {
      sync();
    }
  }, [enabled, sync]);

  return {
    sync,
    syncing: loading,
    error,
    failures: (data?.syncCrmMail ?? []).filter((result) => result.error !== ''),
  };
}
