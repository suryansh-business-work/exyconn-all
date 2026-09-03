import { useState } from 'react';
import { Box, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import {
  useListTrackerBuildsQuery,
  useTrackerBuildSettingsQuery,
} from '@exyconn/shell/graphql/generated';
import { StartBuildForm } from './forms/start-build';
import { buildOutcome, type TrackerBuildRow } from './trackerBuild.status';

/** Which installers a run produced is decided inside the run, so the list reports the run itself. */
const columns: Column<TrackerBuildRow>[] = [
  { key: 'branch', label: 'Branch' },
  { key: 'status', label: 'Outcome', render: (r) => <StatusChip value={buildOutcome(r)} /> },
  { key: 'startedAt', label: 'Started', render: (r) => new Date(r.startedAt).toLocaleString() },
  {
    key: 'url',
    label: 'Run',
    render: (r) => (
      <a href={r.url} target="_blank" rel="noreferrer">
        Open on GitHub
      </a>
    ),
  },
];

/**
 * Tracker Build — start a build of the desktop tracker for the installers you
 * want, and watch the recent runs. The installers land on a GitHub release and
 * are posted to the Slack channels chosen in Settings.
 */
export function TrackerBuildPage() {
  const [starting, setStarting] = useState(false);
  const builds = useListTrackerBuildsQuery({ fetchPolicy: 'cache-and-network' });
  const settings = useTrackerBuildSettingsQuery({ fetchPolicy: 'cache-and-network' });

  const rows = builds.data?.listTrackerBuilds ?? [];
  const channelCount = settings.data?.trackerBuildSettings.slackChannels.length ?? 0;

  const onDone = () => {
    setStarting(false);
    builds.refetch().catch(() => undefined);
  };

  return (
    <Box>
      <PageHeader
        title="Tracker Build"
        subtitle="Build the desktop tracker for Windows, macOS and Linux"
        actionLabel="Create build"
        onAction={() => setStarting(true)}
      />
      <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>
        <Text size="sm" color="text.secondary" sx={{ mb: 2 }}>
          {builds.error
            ? builds.error.message
            : 'The most recent runs of the tracker build workflow.'}
        </Text>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={builds.loading ? 'Loading…' : 'No builds yet.'}
        />
      </Box>
      <CrudDialog open={starting} title="Create tracker build" onClose={() => setStarting(false)}>
        <StartBuildForm
          channelCount={channelCount}
          onCancel={() => setStarting(false)}
          onDone={onDone}
        />
      </CrudDialog>
    </Box>
  );
}
