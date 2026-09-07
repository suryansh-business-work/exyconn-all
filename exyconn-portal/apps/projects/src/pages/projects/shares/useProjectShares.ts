import { useCallback, useState } from 'react';
import {
  useProjectSharesQuery,
  useRevokeProjectShareMutation,
  type ProjectShareFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

/**
 * The share links issued for one project.
 *
 * `newUrl` is the only place a token ever exists in the UI: the server stores nothing but
 * its hash, so once this state is cleared the link cannot be recovered from anywhere.
 */
export function useProjectShares(projectId: string) {
  const confirm = useConfirm();
  const notify = useNotify();
  const [newUrl, setNewUrl] = useState('');
  const { data, refetch } = useProjectSharesQuery({
    variables: { projectId },
    skip: projectId === '',
    fetchPolicy: 'cache-and-network',
  });
  const [revokeShare] = useRevokeProjectShareMutation();

  const onCreated = useCallback(
    async (url: string) => {
      setNewUrl(url);
      await refetch();
    },
    [refetch],
  );

  const forget = useCallback(() => setNewUrl(''), []);

  const copyNewUrl = useCallback(async () => {
    try {
      await globalThis.navigator.clipboard.writeText(newUrl);
      notify('Link copied');
    } catch (error) {
      notify(errorMessage(error, 'Could not copy the link'), 'error');
    }
  }, [newUrl, notify]);

  const revoke = useCallback(
    async (share: ProjectShareFieldsFragment) => {
      const ok = await confirm({
        message: `Revoke "${share.label || 'this link'}"? Anyone holding it loses access at once.`,
        confirmText: 'Revoke',
      });
      if (!ok) {
        return;
      }
      try {
        await revokeShare({ variables: { id: share.id } });
        notify('Link revoked');
        await refetch();
      } catch (error) {
        notify(errorMessage(error, 'Could not revoke the link'), 'error');
      }
    },
    [confirm, revokeShare, notify, refetch],
  );

  return {
    shares: data?.projectShares ?? [],
    newUrl,
    onCreated,
    forget,
    copyNewUrl,
    revoke,
  };
}
