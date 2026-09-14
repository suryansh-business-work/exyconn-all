import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import { useT } from '@exyconn/i18n';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { color } from '@exyconn/shell/components/ui';
import {
  useListFindingsStatsQuery,
  useDeleteFindingMutation,
  ListFindingsPagedDocument,
  type ListFindingsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { FindingForm, type FindingRow } from './forms/finding';
import { FINDING_COLUMNS, type PagedFindingRow, type FindingsGridContext } from './findings-grid';

/**
 * Nonconformities and what was done about them (clause 10.2) — one register whether the
 * finding came from an audit, a customer, an incident or somebody noticing.
 */
export function FindingsPage() {
  const t = useT();
  const { data: statsData, refetch } = useListFindingsStatsQuery();
  const [deleteFinding] = useDeleteFindingMutation();
  const { formatDate } = useSettings();
  const crud = useCrudResource<FindingRow, PagedFindingRow>({
    label: 'Finding',
    onDelete: (row) => deleteFinding({ variables: { id: row.id } }),
    confirmMessage: (row) =>
      t('Delete finding "{reference} — {title}"?', { reference: row.reference, title: row.title }),
    refetch,
  });
  const fetchRows = usePagedFetcher(
    ListFindingsPagedDocument,
    (data: ListFindingsPagedQuery) => data.listFindingsPaged,
  );

  const stats = statsData?.listFindingsStats;
  const statItems: StatItem[] = [
    { label: 'Findings', value: String(statTotal(stats)), accent: color.teal[600] },
    { label: 'Open', value: String(statCount(stats, 'status', 'OPEN')), accent: color.rose[500] },
    {
      label: 'Major',
      value: String(statCount(stats, 'type', 'MAJOR_NONCONFORMITY')),
      accent: color.orange[500],
    },
    {
      label: 'Closed',
      value: String(statCount(stats, 'status', 'CLOSED')),
      accent: color.green[300],
    },
  ];

  const gridContext: FindingsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Findings & CAPA"
      subtitle="What went wrong, what was changed, and whether it worked"
      entityLabel="finding"
      exportFileName="findings"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <FindingForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={FINDING_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by reference, finding, clause, owner or root cause…"
    />
  );
}
