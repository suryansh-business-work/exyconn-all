import { useCallback, useState } from 'react';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useDisconnectSocialAccountMutation,
  useSocialAccountsQuery,
  useSocialAppStatusesQuery,
  useStartSocialConnectMutation,
  useSyncAllSocialAccountsMutation,
  useSyncSocialAccountMutation,
  type SocialAccountsQuery,
  type SocialApp,
} from '@exyconn/shell/graphql/generated';

export type Account = SocialAccountsQuery['socialAccounts'][number];

/** The connected accounts and everything done to them: connect, sync, disconnect. */
export function useSocialAccounts() {
  const notify = useNotify();
  const confirm = useConfirm();
  const providers = useSocialAppStatusesQuery({ fetchPolicy: 'cache-and-network' });
  const accounts = useSocialAccountsQuery({ fetchPolicy: 'cache-and-network' });
  const [startConnect] = useStartSocialConnectMutation();
  const [disconnectAccount] = useDisconnectSocialAccountMutation();
  const [syncOne] = useSyncSocialAccountMutation();
  const [syncEvery] = useSyncAllSocialAccountsMutation();
  const [connecting, setConnecting] = useState<SocialApp | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const reload = useCallback(() => {
    accounts
      .refetch()
      .catch((error: unknown) => portalLogger.warn('Could not reload accounts', error));
  }, [accounts]);

  const connect = async (app: SocialApp) => {
    setConnecting(app);
    try {
      const { data } = await startConnect({ variables: { app } });
      // Off to the provider's consent page; it sends the browser back here when done.
      if (data) globalThis.location.assign(data.startSocialConnect);
    } catch (error) {
      setConnecting(null);
      notify(errorMessage(error, 'Could not start the connection'), 'error');
    }
  };

  const disconnect = async (row: Account) => {
    const ok = await confirm({
      message: 'Disconnect {name}? Posts already published stay where they are.',
      messageValues: { name: row.name },
      confirmText: 'Disconnect',
    });
    if (!ok) return;
    try {
      await disconnectAccount({ variables: { id: row.id } });
      notify('Account disconnected');
      reload();
    } catch (error) {
      notify(errorMessage(error, 'Could not disconnect'), 'error');
    }
  };

  /** Reads one account (or every one, with no id) from its network now. */
  const sync = async (id?: string) => {
    setSyncing(id ?? 'all');
    try {
      const results = id
        ? [(await syncOne({ variables: { id } })).data?.syncSocialAccount]
        : ((await syncEvery()).data?.syncAllSocialAccounts ?? []);
      const failed = results.filter((result) => result?.error);
      const synced = results.reduce((sum, result) => sum + (result?.synced ?? 0), 0);
      if (failed.length > 0) {
        notify(failed.map((result) => result?.error).join(' '), 'error');
      } else {
        notify('Synced {count} post(s)', 'success', { count: synced });
      }
      reload();
    } catch (error) {
      notify(errorMessage(error, 'Could not sync'), 'error');
    } finally {
      setSyncing(null);
    }
  };

  return {
    providers: providers.data?.socialAppStatuses ?? [],
    accounts: accounts.data?.socialAccounts ?? [],
    loading: accounts.loading || providers.loading,
    refetch: accounts.refetch,
    reload,
    connecting,
    syncing,
    connect,
    disconnect,
    sync,
  };
}
