import { Chip, Stack, Typography } from '@exyconn/shell/components/ui';
import type { Column } from '@exyconn/shell/components/data/DataTable';
import { formatDuration } from '@exyconn/shell/pages/tracker-view/tracker.format';
import type { ProjectTimeLogRowFieldsFragment } from '@exyconn/shell/graphql/generated';

export type TimeLogRow = ProjectTimeLogRowFieldsFragment;

/**
 * The ticket a row is against.
 *
 * Time booked to no ticket is labelled rather than left blank: an empty cell reads as
 * missing data, when it is actually a real and common answer — work on the project that
 * nobody carded.
 */
function TicketCell({ row }: Readonly<{ row: TimeLogRow }>) {
  if (!row.taskKey) {
    return (
      <Typography variant="body2" color="text.secondary">
        No ticket
      </Typography>
    );
  }
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip size="small" label={row.taskKey} />
      <Typography variant="body2" noWrap sx={{ maxWidth: 280 }}>
        {row.taskTitle}
      </Typography>
    </Stack>
  );
}

/**
 * Measured time and claimed time in one cell, never added together.
 *
 * The tracker keeps them apart everywhere else for a reason — one was recorded from input,
 * the other asserted by a person and approved by another — and a time log that silently
 * summed them would be the one place that hides it.
 */
function TimeCell({ row }: Readonly<{ row: TimeLogRow }>) {
  if (row.manualMs === 0) {
    return <Typography variant="body2">{formatDuration(row.activeMs)}</Typography>;
  }
  return (
    <Stack>
      <Typography variant="body2">{formatDuration(row.activeMs)}</Typography>
      <Typography variant="caption" color="text.secondary">
        + {formatDuration(row.manualMs)} off-computer
      </Typography>
    </Stack>
  );
}

/** Columns for the per-person, per-ticket summary. */
export const timeLogColumns: Column<TimeLogRow>[] = [
  { key: 'userName', label: 'Who' },
  { key: 'ticket', label: 'Ticket', render: (row) => <TicketCell row={row} /> },
  { key: 'activeMs', label: 'Tracked', render: (row) => <TimeCell row={row} /> },
  { key: 'idleMs', label: 'Idle', render: (row) => formatDuration(row.idleMs) },
  { key: 'sessions', label: 'Sessions', render: (row) => String(row.sessions) },
  { key: 'screenshots', label: 'Shots', render: (row) => String(row.screenshots) },
];
