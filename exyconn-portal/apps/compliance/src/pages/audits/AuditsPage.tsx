import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { color } from '@exyconn/shell/components/ui';
import {
  useListInternalAuditsStatsQuery,
  useDeleteInternalAuditMutation,
  ListInternalAuditsPagedDocument,
  type ListInternalAuditsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { AuditForm, type AuditRow } from './forms/audit';
import { AUDIT_COLUMNS, type PagedAuditRow, type AuditsGridContext } from './audits-grid';

/** The audit programme (clause 9.2): what will be audited, what was, and what it found. */
export function AuditsPage() {
  const { data: statsData, refetch } = useListInternalAuditsStatsQuery();
  const [deleteAudit] = useDeleteInternalAuditMutation();
  const { formatDate } = useSettings();
  const crud = useCrudResource<AuditRow, PagedAuditRow>({
    label: 'Audit',
    onDelete: (row) => deleteAudit({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete audit "{reference} — {title}"?',
      values: { reference: row.reference, title: row.title },
    }),
    refetch,
  });
  const fetchRows = usePagedFetcher(
    ListInternalAuditsPagedDocument,
    (data: ListInternalAuditsPagedQuery) => data.listInternalAuditsPaged,
  );

  const stats = statsData?.listInternalAuditsStats;
  const statItems: StatItem[] = [
    { label: 'Audits', value: String(statTotal(stats)), accent: color.teal[600] },
    {
      label: 'Planned',
      value: String(statCount(stats, 'status', 'PLANNED')),
      accent: color.blue[400],
    },
    {
      label: 'In progress',
      value: String(statCount(stats, 'status', 'IN_PROGRESS')),
      accent: color.orange[500],
    },
    {
      label: 'Reported',
      value: String(statCount(stats, 'status', 'REPORTED')),
      accent: color.green[300],
    },
  ];

  const gridContext: AuditsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Audits"
      subtitle="The audit programme, and what each audit concluded"
      entityLabel="audit"
      exportFileName="audit-programme"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <AuditForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={AUDIT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by reference, audit, scope or auditor…"
    />
  );
}
