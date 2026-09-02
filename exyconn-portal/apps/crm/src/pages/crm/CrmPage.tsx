import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListLeadsStatsQuery,
  useDeleteLeadMutation,
  ListLeadsPagedDocument,
  type ListLeadsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { LeadForm, type LeadRow } from './forms/lead';
import { LEAD_COLUMNS, type PagedLeadRow, type LeadsGridContext } from './leads-grid';

/** CRM module — leads & pipeline dashboard with a server-side leads grid. */
export function CrmPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListLeadsStatsQuery();
  const [deleteLead] = useDeleteLeadMutation();
  const crud = useCrudResource<LeadRow, PagedLeadRow>({
    label: 'Lead',
    onDelete: (row) => deleteLead({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete lead "${row.name}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListLeadsPagedDocument,
    (data: ListLeadsPagedQuery) => data.listLeadsPaged,
  );

  const stats = statsData?.listLeadsStats;
  const statItems: StatItem[] = [
    { label: 'Leads', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Pipeline', value: `₹${statSum(stats, 'value').toLocaleString()}`, accent: '#22c55e' },
    { label: 'Won', value: String(statCount(stats, 'stage', 'WON')), accent: '#7be37b' },
    { label: 'Lost', value: String(statCount(stats, 'stage', 'LOST')), accent: '#ff6b6b' },
  ];

  const gridContext: LeadsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="CRM"
      subtitle="Leads & pipeline"
      entityLabel="lead"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <LeadForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={LEAD_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search leads…"
    />
  );
}
