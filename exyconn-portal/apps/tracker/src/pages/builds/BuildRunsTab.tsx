import { useMemo } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { useListTrackerBuildsQuery } from '@exyconn/shell/graphql/generated';
import { buildOutcome, type TrackerBuildRow } from './buildRun.status';

/**
 * The recent runs of the tracker build workflow — where a build started from here shows up
 * while it is still building. Which installers a run produced is decided inside the run, so the
 * list reports the run itself; its release appears under Published once it finishes.
 */
export function BuildRunsTab() {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const columns = useMemo<Column<TrackerBuildRow>[]>(
    () => [
      { key: 'branch', label: 'Branch' },
      { key: 'status', label: 'Outcome', render: (r) => <StatusChip value={buildOutcome(r)} /> },
      { key: 'startedAt', label: 'Started', render: (r) => formatDateTime(r.startedAt) },
      {
        key: 'url',
        label: 'Run',
        render: (r) => (
          <a href={r.url} target="_blank" rel="noreferrer">
            {t('Open on GitHub')}
          </a>
        ),
      },
    ],
    [t, formatDateTime],
  );
  const builds = useListTrackerBuildsQuery({ fetchPolicy: 'cache-and-network' });

  return (
    <Box sx={readingPanel}>
      <Text component="p" size="sm" color="text.secondary" sx={{ mb: 2 }}>
        {builds.error
          ? builds.error.message
          : t('The most recent runs of the tracker build workflow.')}
      </Text>
      <DataTable
        columns={columns}
        rows={builds.data?.listTrackerBuilds ?? []}
        emptyMessage="No builds yet."
        loading={builds.loading}
        onRefresh={builds.refetch}
      />
    </Box>
  );
}
