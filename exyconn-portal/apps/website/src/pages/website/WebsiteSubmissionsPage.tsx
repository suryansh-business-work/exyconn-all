import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Chip } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudResource } from '@exyconn/crud';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useListWebsiteSubmissionsQuery,
  useDeleteWebsiteSubmissionMutation,
  useConvertWebsiteSubmissionToLeadMutation,
} from '@exyconn/shell/graphql/generated';
import { SubmissionTriageForm, type WebsiteSubmissionRow } from './forms/submission-triage';
import { SubmissionPayload } from './SubmissionPayload';

/** Whether the enquiry has already been handed to sales. */
function LeadCell({ row }: Readonly<{ row: WebsiteSubmissionRow }>) {
  if (!row.leadId) {
    return <>—</>;
  }
  return <Chip size="small" color="success" variant="outlined" label="Lead" />;
}

/** Website module — inbox for forms submitted on exyconn.com. Triage, or hand off to the CRM. */
export function WebsiteSubmissionsPage() {
  const { data, loading, refetch } = useListWebsiteSubmissionsQuery();
  const [deleteSubmission] = useDeleteWebsiteSubmissionMutation();
  const [convertToLead] = useConvertWebsiteSubmissionToLeadMutation();
  const confirm = useConfirm();
  const notify = useNotify();
  const crud = useCrudResource<WebsiteSubmissionRow>({
    label: 'Submission',
    onDelete: (row) => deleteSubmission({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete this ${row.formType} submission?`,
    refetch,
  });
  const { formatDate } = useSettings();

  const convert = async (row: WebsiteSubmissionRow) => {
    const ok = await confirm({
      title: 'Convert to lead',
      message: `File this ${row.formType} submission as a CRM lead?`,
      confirmText: 'Convert',
    });
    if (!ok) {
      return;
    }
    try {
      const res = await convertToLead({ variables: { id: row.id } });
      notify(`Lead "${res.data?.convertWebsiteSubmissionToLead.name ?? ''}" created in the CRM`);
      await refetch();
    } catch (err) {
      notify(errorMessage(err, 'Conversion failed'), 'error');
    }
  };

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
    { key: 'leadId', label: 'Lead', render: (r) => <LeadCell row={r} /> },
    { key: 'createdAt', label: 'Received', render: (r) => formatDate(r.createdAt) },
  ];

  const actions: RowAction<WebsiteSubmissionRow>[] = [
    {
      icon: <PersonAddIcon fontSize="small" />,
      tooltip: 'Convert to lead',
      ariaLabel: 'convert to lead',
      color: 'primary',
      onClick: convert,
      hidden: (row) => Boolean(row.leadId),
    },
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
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage={loading ? 'Loading…' : 'No submissions yet.'}
      />
    </ModuleDashboard>
  );
}
