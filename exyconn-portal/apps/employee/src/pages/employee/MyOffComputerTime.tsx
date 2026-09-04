import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import UndoIcon from '@mui/icons-material/Undo';
import { Box, Button, Card, CardHeader, Typography } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  MyTrackerManualEntriesDocument,
  useMyTrackerManualEntriesQuery,
  useWithdrawTrackerManualEntryMutation,
} from '@exyconn/shell/graphql/generated';
import { formatDuration } from '@exyconn/shell/pages/tracker-view/tracker.format';
import { OffComputerTimeForm, type OffComputerEntryRow } from './forms/off-computer-time';
import { ManualEntryStatusChip } from './ManualEntryStatusChip';

interface MyOffComputerTimeProps {
  /** The month on screen, so the list matches the calendar above it. */
  from: string;
  to: string;
  projects: ReadonlyArray<{ id: string; name: string }>;
}

/**
 * The employee's own off-computer time: what they have claimed this month, where each
 * claim stands, and the form to add another. Approved entries are the only ones that
 * count, so the status chip is the most important column here.
 */
export function MyOffComputerTime({ from, to, projects }: Readonly<MyOffComputerTimeProps>) {
  const { formatDateTime } = useSettings();
  const notify = useNotify();
  const confirm = useConfirm();
  const [adding, setAdding] = useState(false);
  const { data } = useMyTrackerManualEntriesQuery({ variables: { from, to } });
  const [withdrawEntry] = useWithdrawTrackerManualEntryMutation({
    refetchQueries: [MyTrackerManualEntriesDocument],
  });

  const onWithdraw = async (entry: OffComputerEntryRow) => {
    if (entry.status !== 'PENDING') {
      notify('Only an entry still awaiting review can be withdrawn.', 'error');
      return;
    }
    const ok = await confirm({
      title: 'Withdraw this entry?',
      message: `"${entry.note}" will be removed and never reviewed.`,
      confirmText: 'Withdraw',
    });
    if (!ok) return;
    try {
      await withdrawEntry({ variables: { id: entry.id } });
      notify('Entry withdrawn');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not withdraw the entry', 'error');
    }
  };

  const columns: Column<OffComputerEntryRow>[] = [
    { key: 'startedAt', label: 'Started', render: (row) => formatDateTime(row.startedAt) },
    { key: 'durationMs', label: 'Length', render: (row) => formatDuration(row.durationMs) },
    { key: 'projectName', label: 'Project', render: (row) => row.projectName || '—' },
    { key: 'note', label: 'What for' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <ManualEntryStatusChip status={row.status} note={row.reviewNote} />,
    },
  ];

  // Only a pending entry can be withdrawn, and the table renders one action set for every
  // row — so the guard lives in the handler and the reviewed rows say why nothing happened.
  const actions: RowAction<OffComputerEntryRow>[] = [
    {
      icon: <UndoIcon fontSize="small" />,
      tooltip: 'Withdraw this entry',
      ariaLabel: 'Withdraw entry',
      onClick: onWithdraw,
    },
  ];

  const rows = data?.myTrackerManualEntries ?? [];

  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader
        title="Off-computer time"
        action={
          <Button
            size="small"
            variant={adding ? 'text' : 'contained'}
            startIcon={adding ? undefined : <AddIcon />}
            onClick={() => setAdding((open) => !open)}
          >
            {adding ? 'Close' : 'Add time'}
          </Button>
        }
      />
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Meetings, client visits and calls the tracker could not see. Every entry is reviewed
          before it counts towards your hours.
        </Typography>
        {adding && (
          <Box sx={{ mb: 3 }}>
            <OffComputerTimeForm projects={projects} onDone={() => setAdding(false)} />
          </Box>
        )}
        <DataTable
          rows={rows}
          columns={columns}
          actions={actions}
          emptyMessage="No off-computer time claimed this month."
        />
      </Box>
    </Card>
  );
}
