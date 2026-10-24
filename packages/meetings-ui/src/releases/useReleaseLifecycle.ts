import { useT } from '@exyconn/i18n';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import {
  MaReleaseStatus,
  useDeleteMaReleaseMutation,
  useMaSetReleaseStatusMutation,
} from '@exyconn/shell/graphql/generated';
import type { ReleaseRow } from '../forms/release-status';
import { useRunNotified } from '../lib/useRunNotified';

/** Ending a build's life on the Builds page: deprecate it, or delete it with its ZIP. */
export function useReleaseLifecycle() {
  const t = useT();
  const confirm = useConfirm();
  const runNotified = useRunNotified();
  const [setStatus] = useMaSetReleaseStatusMutation();
  const [deleteRelease] = useDeleteMaReleaseMutation();

  const deprecate = async (release: ReleaseRow) => {
    const ok = await confirm({
      title: 'Deprecate version {version}?',
      titleValues: { version: release.version },
      message: 'Nobody will be offered this build any more. Installed copies keep working.',
      confirmText: 'Deprecate',
      destructive: true,
    });
    if (ok) {
      await runNotified(
        () =>
          setStatus({
            variables: {
              id: release.id,
              input: {
                status: MaReleaseStatus.Deprecated,
                note: t('Deprecated from the releases page'),
              },
            },
          }),
        'Release {version} deprecated',
        { version: release.version },
      );
    }
  };

  const remove = async (release: ReleaseRow) => {
    const ok = await confirm({
      title: 'Delete version {version}?',
      titleValues: { version: release.version },
      message: 'The build and its ZIP are deleted for good. Installed copies keep working.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (ok) {
      await runNotified(
        () =>
          deleteRelease({
            variables: { id: release.id },
            update: (cache) => {
              cache.evict({ id: cache.identify(release) });
              cache.gc();
            },
          }),
        'Release {version} deleted',
        { version: release.version },
      );
    }
  };

  return { deprecate, remove };
}
