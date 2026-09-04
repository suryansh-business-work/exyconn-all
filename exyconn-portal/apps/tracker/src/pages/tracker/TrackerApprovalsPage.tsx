import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  TrackerPendingManualEntriesDocument,
  TrackerManualEntryStatus,
  useReviewTrackerManualEntryMutation,
  useTrackerPendingManualEntriesQuery,
  type TrackerManualEntryFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { formatDuration } from '@exyconn/shell/pages/tracker-view/tracker.format';

/**
 * The off-computer time queue.
 *
 * Claimed hours are the one thing in the tracker nobody measured, so they wait here until a
 * person decides. Approving is what puts them on a calendar, a total and an invoice — which
 * is why a decision cannot be taken back from this screen.
 */
export function TrackerApprovalsPage() {
  const { formatDateTime } = useSettings();
  const notify = useNotify();
  const confirm = useConfirm();
  const { data } = useTrackerPendingManualEntriesQuery({ fetchPolicy: 'cache-and-network' });
  const [review] = useReviewTrackerManualEntryMutation({
    refetchQueries: [TrackerPendingManualEntriesDocument],
  });

  const decide = async (
    entry: TrackerManualEntryFieldsFragment,
    status: TrackerManualEntryStatus,
  ) => {
    const approving = status === TrackerManualEntryStatus.Approved;
    const ok = await confirm({
      title: approving ? 'Approve this time?' : 'Reject this time?',
      message: approving
        ? `${formatDuration(entry.durationMs)} for ${entry.userName} will count towards their hours and any billing. This cannot be undone.`
        : `${formatDuration(entry.durationMs)} for ${entry.userName} will not count. This cannot be undone.`,
      confirmText: approving ? 'Approve' : 'Reject',
    });
    if (!ok) return;
    try {
      await review({ variables: { id: entry.id, status } });
      notify(approving ? 'Time approved' : 'Time rejected');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save the decision', 'error');
    }
  };

  const columns: Column<TrackerManualEntryFieldsFragment>[] = [
    { key: 'userName', label: 'Employee' },
    { key: 'startedAt', label: 'Started', render: (row) => formatDateTime(row.startedAt) },
    { key: 'endedAt', label: 'Ended', render: (row) => formatDateTime(row.endedAt) },
    { key: 'durationMs', label: 'Length', render: (row) => formatDuration(row.durationMs) },
    { key: 'projectName', label: 'Project', render: (row) => row.projectName || '—' },
    { key: 'note', label: 'What for' },
  ];

  const actions: RowAction<TrackerManualEntryFieldsFragment>[] = [
    {
      icon: <CheckIcon fontSize="small" />,
      tooltip: 'Approve this entry',
      ariaLabel: 'Approve entry',
      color: 'success',
      onClick: (row) => decide(row, TrackerManualEntryStatus.Approved),
    },
    {
      icon: <CloseIcon fontSize="small" />,
      tooltip: 'Reject this entry',
      ariaLabel: 'Reject entry',
      color: 'error',
      onClick: (row) => decide(row, TrackerManualEntryStatus.Rejected),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Off-computer time"
        subtitle="Work claimed away from the computer, waiting on a decision"
      />
      <DataTable
        rows={data?.trackerPendingManualEntries ?? []}
        columns={columns}
        actions={actions}
        emptyMessage="Nothing waiting for review."
      />
    </Box>
  );
}
