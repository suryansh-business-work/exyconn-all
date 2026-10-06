import { useDeleteCmsAssetMutation } from '@exyconn/shell/graphql/generated';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import type { MediaAssetActions } from './MediaAssetCard';
import type { MediaAsset } from './useMediaAssets';

/** Copy, alt text and delete for a library card; reloads the library after a delete. */
export function useMediaActions(
  reload: () => Promise<unknown>,
  editAlt: (asset: MediaAsset) => void,
): MediaAssetActions {
  const confirm = useConfirm();
  const notify = useNotify();
  const [deleteAsset] = useDeleteCmsAssetMutation();

  const remove = async (asset: MediaAsset) => {
    const ok = await confirm({
      message: 'Delete {name}? Pages that show it will show a broken image.',
      messageValues: { name: asset.name },
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await deleteAsset({ variables: { id: asset.id } });
    notify('File deleted', 'success');
    await reload();
  };

  return {
    onCopy: (asset) => {
      copyToClipboard(asset.url)
        .then((copied) =>
          notify(copied ? 'URL copied' : 'Could not copy the URL', copied ? 'success' : 'error'),
        )
        .catch((error: unknown) => notify(errorMessage(error, 'Could not copy the URL'), 'error'));
    },
    onEditAlt: editAlt,
    onDelete: (asset) => {
      remove(asset).catch((error: unknown) =>
        notify(errorMessage(error, 'Delete failed'), 'error'),
      );
    },
  };
}
