import { useEffect, useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  FilterOp,
  ListWebsiteSubmissionsPagedDocument,
  useConvertWebsiteSubmissionToLeadMutation,
  useDeleteWebsiteSubmissionMutation,
  useListWebsiteSubmissionsStatsQuery,
  type ListWebsiteSubmissionsPagedQuery,
  type TableFilterInput,
} from '@exyconn/shell/graphql/generated';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { SubmissionTriageForm, type WebsiteSubmissionRow } from './forms/submission-triage';
import { SubmissionPayload } from './SubmissionPayload';
import { SubmissionFormTypeFilter } from './SubmissionFormTypeFilter';
import { color } from '@exyconn/shell/components/ui';
import {
  SUBMISSION_COLUMNS,
  type PagedSubmissionRow,
  type SubmissionsGridContext,
} from './submissions-grid';

/**
 * Website module — inbox for forms submitted on exyconn.com. Triage, or hand off to the CRM.
 *
 * Server-paged rather than a whole-list read: the inbox only ever grows, and an unbounded
 * `listWebsiteSubmissions` was going to be the first screen to fall over.
 *
 * No `crud` prop, so there is no "New submission" button: a submission is something a
 * visitor makes on the public site, never something the portal creates. The triage drawer is
 * still the shared one — it just opens from a row action rather than from a header button.
 */
export function WebsiteSubmissionsPage() {
  const { data: statsData, refetch: refetchStats } = useListWebsiteSubmissionsStatsQuery();
  const [deleteSubmission] = useDeleteWebsiteSubmissionMutation();
  const [convertToLead] = useConvertWebsiteSubmissionToLeadMutation();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();
  const [formType, setFormType] = useState('');

  const crud = useCrudResource<WebsiteSubmissionRow, PagedSubmissionRow>({
    label: 'Submission',
    onDelete: (row) => deleteSubmission({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete this ${row.formType} submission?`,
    refetch: refetchStats,
  });
  const extraFilters: TableFilterInput[] = formType
    ? [{ field: 'formType', op: FilterOp.Equals, value: formType }]
    : [];
  const fetchRows = usePagedFetcher(
    ListWebsiteSubmissionsPagedDocument,
    (data: ListWebsiteSubmissionsPagedQuery) => data.listWebsiteSubmissionsPaged,
    extraFilters,
  );

  // The fetcher reads its extra filters at fetch time, so picking a form has to tell the
  // grid to go again — otherwise the chips change and the rows do not.
  const { reload } = crud;
  useEffect(() => {
    reload();
  }, [formType, reload]);

  const convert = async (row: PagedSubmissionRow) => {
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
      crud.reload();
    } catch (err) {
      notify(errorMessage(err, 'Conversion failed'), 'error');
    }
  };

  const stats = statsData?.listWebsiteSubmissionsStats;
  const statItems: StatItem[] = [
    { label: 'Submissions', value: String(statTotal(stats)), accent: color.blue[400] },
    { label: 'New', value: String(statCount(stats, 'status', 'new')), accent: color.orange[500] },
    {
      label: 'In review',
      value: String(statCount(stats, 'status', 'in-review')),
      accent: color.amber[200],
    },
    {
      label: 'Resolved',
      value: String(statCount(stats, 'status', 'resolved')),
      accent: color.green[300],
    },
  ];

  const gridContext: SubmissionsGridContext = {
    actions: { convert, edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Form submissions"
      subtitle="Enquiries captured by the exyconn.com website"
      entityLabel="submission"
      exportFileName="website-submissions"
      stats={statItems}
      refreshSignal={crud.refreshSignal}
      columnDefs={SUBMISSION_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by form, source, status or notes…"
      toolbar={<SubmissionFormTypeFilter value={formType} onChange={setFormType} />}
      extraDialogs={
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
    />
  );
}
