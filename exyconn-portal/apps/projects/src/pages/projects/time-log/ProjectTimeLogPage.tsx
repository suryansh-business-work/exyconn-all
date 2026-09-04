import { useState } from 'react';
import { Alert, Box, Button, Chip, Flex, Stack, Typography } from '@exyconn/shell/components/ui';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { DataTable } from '@exyconn/shell/components/data/DataTable';
import { useTrackerMonth } from '@exyconn/shell/pages/tracker-view/useTrackerMonth';
import { formatDuration } from '@exyconn/shell/pages/tracker-view/tracker.format';
import { useProjectTimeLogQuery } from '@exyconn/shell/graphql/generated';
import { timeLogColumns, type TimeLogRow } from './time-log-columns';
import { TimeLogSessions } from './TimeLogSessions';

/**
 * Who worked on which ticket in this project, and for how long.
 *
 * The month navigator is the shared one the tracker's own views use, so a month here and a
 * month there mean the same window — including across a timezone change, which is the sort
 * of thing two independent date helpers quietly disagree about.
 */
export function ProjectTimeLogPage({ projectId }: Readonly<{ projectId: string }>) {
  const month = useTrackerMonth();
  const [openRow, setOpenRow] = useState<TimeLogRow | null>(null);
  const { data, loading } = useProjectTimeLogQuery({
    variables: { projectId, from: month.range.from, to: month.range.to },
    skip: projectId === '',
    fetchPolicy: 'cache-and-network',
  });

  const log = data?.projectTimeLog;
  const rows = log?.rows ?? [];

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Flex direction="row" alignItems="center" spacing={1}>
        <Button size="small" startIcon={<ChevronLeftIcon />} onClick={month.prev}>
          Prev
        </Button>
        <Typography variant="subtitle1" sx={{ minWidth: 160, textAlign: 'center' }}>
          {month.monthLabel}
        </Typography>
        <Button size="small" endIcon={<ChevronRightIcon />} onClick={month.next}>
          Next
        </Button>
        <Box sx={{ flex: 1 }} />
        {log ? (
          <Stack direction="row" spacing={1}>
            <Chip size="small" label={`Tracked ${formatDuration(log.totalActiveMs)}`} />
            {log.totalManualMs > 0 ? (
              <Chip
                size="small"
                variant="outlined"
                label={`Off-computer ${formatDuration(log.totalManualMs)}`}
              />
            ) : null}
          </Stack>
        ) : null}
      </Flex>

      {log && !log.canViewScreenshots ? (
        <Alert severity="info">
          You can see who worked on what and for how long. Screenshots stay with the Tracker role —
          they are a picture of somebody&apos;s screen, not a project metric.
        </Alert>
      ) : null}

      <DataTable
        rows={rows}
        columns={timeLogColumns}
        onRowClick={(row) => setOpenRow(openRow?.id === row.id ? null : row)}
        emptyMessage={
          loading ? 'Loading the time log…' : 'No tracked time on this project for this month.'
        }
      />

      {openRow ? (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {openRow.userName} · {openRow.taskKey || 'No ticket'}
          </Typography>
          <TimeLogSessions
            projectId={projectId}
            from={month.range.from}
            to={month.range.to}
            userId={openRow.userId}
            taskId={openRow.taskId}
            canViewScreenshots={log?.canViewScreenshots ?? false}
          />
        </Box>
      ) : null}
    </Stack>
  );
}
