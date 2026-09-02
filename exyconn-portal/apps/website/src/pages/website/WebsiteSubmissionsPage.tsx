import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudResource } from '@exyconn/crud';
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
  const crud = useCrudResource<WebsiteSubmissionRow>({
    label: 'Submission',
    onDelete: (row) => deleteSubmission({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete this ${row.formType} submission?`,
    refetch,
  });
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

  return (
    <ModuleDashboard
      title="Form submissions"
      subtitle="Enquiries captured by the exyconn.com website"
      stats={stats}
      dialog={
        <CrudDialog open={crud.open} title="Triage submission" onClose={crud.close}>
          {crud.editing && (
            <>
              <SubmissionPayload data={crud.editing.submissionData} />
              <SubmissionTriageForm
                submission={crud.editing}
                onCancel={crud.close}
                onDone={crud.onDone}
              />
            </>
          )}
        </CrudDialog>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage={loading ? 'Loading…' : 'No submissions yet.'}
      />
    </ModuleDashboard>
  );
}
