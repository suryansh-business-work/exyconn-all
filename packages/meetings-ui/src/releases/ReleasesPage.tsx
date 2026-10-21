import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import BlockIcon from '@mui/icons-material/Block';
import DownloadIcon from '@mui/icons-material/Download';
import EditNoteIcon from '@mui/icons-material/EditNote';
import HistoryIcon from '@mui/icons-material/History';
import { Box } from '@exyconn/shell/components/ui';
import { densePanel } from '@exyconn/shell/components/glass/glass';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { DataTable, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import {
  MaReleaseStatus,
  useMaReleasesQuery,
  useMaSetReleaseStatusMutation,
} from '@exyconn/shell/graphql/generated';
import { ReleaseStatusForm, type ReleaseRow } from '../forms/release-status';
import { LoadError } from '../lib/LoadError';
import { useRunNotified } from '../lib/useRunNotified';
import { ReleaseHistoryDialog } from './ReleaseHistoryDialog';
import { useReleaseColumns } from './useReleaseColumns';
import { useReleaseDownload } from './useReleaseDownload';

/** AI → Meeting Assistant → Releases: every extension build CI registered, and its lifecycle. */
export function ReleasesPage() {
  const t = useT();
  const confirm = useConfirm();
  const runNotified = useRunNotified();
  const columns = useReleaseColumns();
  const { download } = useReleaseDownload();
  const { data, loading, error, refetch } = useMaReleasesQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [setStatus] = useMaSetReleaseStatusMutation();
  const [changing, setChanging] = useState<ReleaseRow | null>(null);
  const [history, setHistory] = useState<ReleaseRow | null>(null);

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

  const actions: RowAction<ReleaseRow>[] = [
    {
      icon: <DownloadIcon fontSize="small" />,
      tooltip: 'Download',
      ariaLabel: 'Download this build',
      hidden: (row) => !row.downloadable,
      onClick: (row) => download(row.id),
    },
    {
      icon: <EditNoteIcon fontSize="small" />,
      tooltip: 'Change status',
      ariaLabel: 'Change status',
      onClick: setChanging,
    },
    {
      icon: <HistoryIcon fontSize="small" />,
      tooltip: 'Status history',
      ariaLabel: 'Status history',
      onClick: setHistory,
    },
    {
      icon: <BlockIcon fontSize="small" />,
      tooltip: 'Deprecate',
      ariaLabel: 'Deprecate this build',
      color: 'error',
      hidden: (row) => row.status === MaReleaseStatus.Deprecated,
      onClick: deprecate,
    },
  ];

  return (
    <>
      <PageHeader
        title="Extension releases"
        subtitle="Builds are registered by CI when the extension is built — there is nothing to upload here"
      />
      <Box sx={densePanel}>
        {error ? (
          <LoadError message={error.message} onRetry={() => refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={data?.maReleases ?? []}
            actions={actions}
            loading={loading && !data}
            onRefresh={() => refetch()}
            emptyMessage="No release available yet."
          />
        )}
      </Box>
      <CrudDialog
        open={changing !== null}
        title={t('Change release status')}
        onClose={() => setChanging(null)}
      >
        {changing && (
          <ReleaseStatusForm
            release={changing}
            onDone={() => setChanging(null)}
            onCancel={() => setChanging(null)}
          />
        )}
      </CrudDialog>
      <ReleaseHistoryDialog release={history} onClose={() => setHistory(null)} />
    </>
  );
}
