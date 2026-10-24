import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Button, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import {
  useDeleteTrackerBuildReleaseMutation,
  useTrackerBuildReleasesQuery,
} from '@exyconn/shell/graphql/generated';
import { PLATFORMS } from '../download/download.config';
import { downloadFiles } from './downloadFiles';
import { buildDetailsPath, installerUrls, type TrackerBuildReleaseRow } from './builds.types';

const PLATFORM_LABELS = new Map<string, string>(PLATFORMS.map((p) => [p.key, p.label]));

/** The platforms a build has installers for, in the Download page's order. */
function platformsOf(row: TrackerBuildReleaseRow): string {
  const present = new Set(row.assets.map((asset) => asset.platform));
  return PLATFORMS.filter((p) => present.has(p.key))
    .map((p) => PLATFORM_LABELS.get(p.key))
    .join(', ');
}

/**
 * Every published tracker build: tick rows to download or delete them together, or open one
 * for its installers platform by platform.
 */
export function BuildReleasesTab() {
  const t = useT();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDateTime, formatNumber } = useFormatters();
  const releases = useTrackerBuildReleasesQuery({ fetchPolicy: 'cache-and-network' });
  const [deleteRelease] = useDeleteTrackerBuildReleaseMutation();
  const rows = useMemo(() => releases.data?.trackerBuildReleases ?? [], [releases.data]);

  const columns = useMemo<Column<TrackerBuildReleaseRow>[]>(
    () => [
      { key: 'version', label: 'Version' },
      { key: 'platforms', label: 'Installers', render: platformsOf },
      {
        key: 'downloads',
        label: 'Downloads',
        render: (r) => formatNumber(r.assets.reduce((sum, a) => sum + a.downloadCount, 0)),
      },
      { key: 'publishedAt', label: 'Published', render: (r) => formatDateTime(r.publishedAt) },
    ],
    [formatDateTime, formatNumber],
  );

  const actions: RowAction<TrackerBuildReleaseRow>[] = [
    {
      icon: <DownloadIcon fontSize="small" />,
      tooltip: 'Download every installer',
      ariaLabel: 'Download every installer',
      onClick: (row) => downloadFiles(installerUrls([row])),
    },
  ];

  const onDelete = async (row: TrackerBuildReleaseRow) => {
    const ok = await confirm({
      title: 'Delete build',
      message: 'Delete build {version}? Its GitHub release, installers and tag are removed.',
      messageValues: { version: row.version },
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteRelease({
        variables: { id: row.id },
        update: (cache) => {
          cache.evict({ id: cache.identify(row) });
          cache.gc();
        },
      });
      notify('Build {version} deleted', 'success', { version: row.version });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete the build', 'error');
    }
  };

  const selectionActions = (ids: readonly string[]) => {
    const picked = new Set(ids);
    return (
      <Button
        size="small"
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => downloadFiles(installerUrls(rows.filter((row) => picked.has(row.id))))}
      >
        {t('Download selected')}
      </Button>
    );
  };

  return (
    <Box sx={readingPanel}>
      <Text component="p" size="sm" color="text.secondary" sx={{ mb: 2 }}>
        {releases.error
          ? releases.error.message
          : t('Every published tracker build, newest first. Open one for its installers.')}
      </Text>
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        onDelete={onDelete}
        onRowClick={(row) => navigate(buildDetailsPath(row.id))}
        bulkEntity="TrackerBuildRelease"
        selectionActions={selectionActions}
        emptyMessage="No builds published yet."
        loading={releases.loading}
        onRefresh={releases.refetch}
      />
    </Box>
  );
}
