import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import BlockIcon from '@mui/icons-material/Block';
import DownloadIcon from '@mui/icons-material/Download';
import EditNoteIcon from '@mui/icons-material/EditNote';
import HistoryIcon from '@mui/icons-material/History';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { Box, Button } from '@exyconn/shell/components/ui';
import { densePanel } from '@exyconn/shell/components/glass/glass';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { DataTable, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { MaReleaseStatus, useMaReleasesQuery } from '@exyconn/shell/graphql/generated';
import { ReleaseStatusForm, type ReleaseRow } from '../forms/release-status';
import { LoadError } from '../lib/LoadError';
import { ApproveReleaseDialog } from './ApproveReleaseDialog';
import { ReleaseHistoryDialog } from './ReleaseHistoryDialog';
import { ReleaseManagerActions } from './ReleaseManagerActions';
import { useReleaseColumns } from './useReleaseColumns';
import { useReleaseDownload } from './useReleaseDownload';
import { useReleaseLifecycle } from './useReleaseLifecycle';
import { releaseDetailsPath } from './releasePaths';

/** Builds a release manager can approve in one step: offered to people once approved. */
const AWAITING_APPROVAL: ReadonlySet<MaReleaseStatus> = new Set([
  MaReleaseStatus.QaPending,
  MaReleaseStatus.ReadyForInternalTesting,
]);

/**
 * AI → Meeting Assistant → Builds: every extension build, how it got here and its lifecycle.
 * Tick builds to download or delete them together; open one for its details.
 */
export function ReleasesPage() {
  const t = useT();
  const navigate = useNavigate();
  const columns = useReleaseColumns();
  const { download, downloadMany } = useReleaseDownload();
  const { deprecate, remove } = useReleaseLifecycle();
  const { data, loading, error, refetch } = useMaReleasesQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [changing, setChanging] = useState<ReleaseRow | null>(null);
  const [history, setHistory] = useState<ReleaseRow | null>(null);
  const [approving, setApproving] = useState<ReleaseRow | null>(null);
  const rows = data?.maReleases ?? [];

  /** Downloads the ticked builds people may download; the others have no file to offer. */
  const selectionActions = (ids: readonly string[]) => {
    const picked = new Set(ids);
    const downloadable = rows.filter((row) => picked.has(row.id) && row.downloadable);
    return (
      <Button
        size="small"
        variant="outlined"
        startIcon={<DownloadIcon />}
        disabled={downloadable.length === 0}
        onClick={() => downloadMany(downloadable.map((row) => row.id))}
      >
        {t('Download selected')}
      </Button>
    );
  };

  const actions: RowAction<ReleaseRow>[] = [
    {
      icon: <TaskAltIcon fontSize="small" />,
      tooltip: 'Approve and publish',
      ariaLabel: 'Approve and publish this build',
      color: 'success',
      hidden: (row) => !AWAITING_APPROVAL.has(row.status),
      onClick: setApproving,
    },
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
        title="Extension builds"
        subtitle="Every merge to main builds a new version. Approve a build to let people download it."
      >
        <ReleaseManagerActions />
      </PageHeader>
      <Box sx={densePanel}>
        {error ? (
          <LoadError message={error.message} onRetry={() => refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            actions={actions}
            onDelete={remove}
            onRowClick={(row) => navigate(releaseDetailsPath(row.id))}
            bulkEntity="MaRelease"
            selectionActions={selectionActions}
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
      <ApproveReleaseDialog release={approving} onClose={() => setApproving(null)} />
    </>
  );
}
