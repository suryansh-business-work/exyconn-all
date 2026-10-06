import { useSetDefaultCmsSiteMutation } from '@exyconn/shell/graphql/generated';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

/** "Make default": the site unknown hosts and localhost are served as. Asks first. */
export function useMakeDefaultSite(reload: () => Promise<unknown>) {
  const [setDefault] = useSetDefaultCmsSiteMutation();
  const confirm = useConfirm();
  const notify = useNotify();

  const run = async (site: { id: string; name: string }) => {
    const ok = await confirm({
      title: 'Make {name} the default website?',
      titleValues: { name: site.name },
      message: 'Hosts no website claims, and local previews, will show this site.',
      confirmText: 'Make default',
    });
    if (!ok) return;
    await setDefault({ variables: { id: site.id } });
    await reload();
    notify('{name} is now the default website', 'success', { name: site.name });
  };

  return (site: { id: string; name: string }) => {
    run(site).catch((error: unknown) =>
      notify(errorMessage(error, 'Could not change the default'), 'error'),
    );
  };
}
