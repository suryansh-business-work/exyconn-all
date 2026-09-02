import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListWebsiteSubmissionsQuery,
  useDeleteWebsiteSubmissionMutation,
} from '@exyconn/shell/graphql/generated';
import { SubmissionTriageForm, type WebsiteSubmissionRow } from './forms/submission-triage';
import { SubmissionPayload } from './SubmissionPayload';

/** Website module — inbox for forms submitted on exyconn.com. Read + triage only. */
export function WebsiteSubmissionsPage() {
  const { data, loading, refetch } = useListWebsiteSubmissionsQuery();
  const [deleteSubmission] = useDeleteWebsiteSubmissionMutation();
  const dialog = useCrudDialog<WebsiteSubmissionRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();

  const rows = data?.listWebsiteSubmissions ?? [];
  const countOf = (status: string) => String(rows.filter((r) => r.status === status).length);
  const stats: StatItem[] = [
    { label: 'Submissions', value: String(rows.length), accent: '#4f8cff' },
    { label: 'New', value: countOf('new'), accent: '#f9851f' },
    { label: 'In review', value: countOf('in-review'), accent: '#ffd166' },
    { label: 'Resolved', value: countOf('resolved'), accent: '#7be37b' },
  ];

  const columns: Column<WebsiteSubmissionRow>[] = [
    { key: 'formType', label: 'Form' },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'createdAt', label: 'Received', render: (r) => formatDate(r.createdAt) },
  ];

  const handleDelete = async (row: WebsiteSubmissionRow) => {
    const ok = await confirm({
      message: `Delete this ${row.formType} submission?`,
      confirmText: 'Delete',
    });
    if (!ok) return;
    await deleteSubmission({ variables: { id: row.id } });
    await refetch();
    notify('Submission deleted');
  };

  return (
    <ModuleDashboard
      title="Form submissions"
      subtitle="Enquiries captured by the exyconn.com website"
      stats={stats}
      dialog={
        <CrudDialog open={dialog.open} title="Triage submission" onClose={dialog.close}>
          {dialog.editing && (
            <>
              <SubmissionPayload data={dialog.editing.submissionData} />
              <SubmissionTriageForm
                submission={dialog.editing}
                onCancel={dialog.close}
                onDone={() => {
                  void refetch();
                  dialog.close();
                }}
              />
            </>
          )}
        </CrudDialog>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        onEdit={dialog.openEdit}
        onDelete={handleDelete}
        emptyMessage={loading ? 'Loading…' : 'No submissions yet.'}
      />
    </ModuleDashboard>
  );
}
