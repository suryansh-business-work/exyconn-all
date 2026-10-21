import { useT } from '@exyconn/i18n';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { MaReleaseChannel, useMaApproveReleaseMutation } from '@exyconn/shell/graphql/generated';
import { ReleaseChannelForm } from '../forms/release-channel';
import type { ReleaseRow } from '../forms/release-status';
import { useRunNotified } from '../lib/useRunNotified';

/**
 * Approves a build waiting for review and offers it on a channel in one step. Stable is the
 * default: every company receives it, whichever channel it follows.
 */
export function ApproveReleaseDialog({
  release,
  onClose,
}: Readonly<{ release: ReleaseRow | null; onClose: () => void }>) {
  const t = useT();
  const runNotified = useRunNotified();
  const [approve] = useMaApproveReleaseMutation({
    refetchQueries: ['MaLatestRelease', 'MaReleaseOverview'],
  });
  return (
    <CrudDialog
      open={release !== null}
      title={t('Approve version {version}', { version: release?.version ?? '' })}
      onClose={onClose}
    >
      {release && (
        <ReleaseChannelForm
          defaultChannel={MaReleaseChannel.Stable}
          submitLabel="Approve and publish"
          onSubmit={(channel) =>
            runNotified(
              () => approve({ variables: { id: release.id, channel } }),
              'Version {version} can now be downloaded',
              { version: release.version },
            )
          }
          onDone={onClose}
          onCancel={onClose}
        />
      )}
    </CrudDialog>
  );
}
