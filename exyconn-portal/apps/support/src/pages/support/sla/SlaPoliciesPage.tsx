import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  ListSupportSlaPoliciesPagedDocument,
  useDeleteSupportSlaPolicyMutation,
  useListSupportSlaPoliciesStatsQuery,
  useSupportSlaSummaryQuery,
  type ListSupportSlaPoliciesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { SlaPolicyForm, type SlaPolicyRow } from './forms/sla-policy';
import { color } from '@exyconn/shell/components/ui';
import {
  SLA_POLICY_COLUMNS,
  type PagedSlaPolicyRow,
  type SlaPoliciesGridContext,
} from './sla-policies-grid';

/**
 * Support › SLA Policies: what the team promises for each priority, and how the queue is
 * currently doing against those promises. Editing a policy changes the deadline every
 * ticket raised from then on is measured by; tickets already open keep the deadline they
 * were given, which is the only way a promise made to somebody stays the one they were told.
 */
export function SlaPoliciesPage() {
  const { data: statsData, refetch: refetchStats } = useListSupportSlaPoliciesStatsQuery();
  const { data: slaData } = useSupportSlaSummaryQuery({ fetchPolicy: 'cache-and-network' });
  const [deletePolicy] = useDeleteSupportSlaPolicyMutation();

  const crud = useCrudResource<SlaPolicyRow, PagedSlaPolicyRow>({
    label: 'SLA policy',
    onDelete: (row) => deletePolicy({ variables: { id: row.id } }),
    confirmMessage: (row) =>
      `Delete the ${row.priority} policy? Tickets raised at that priority will carry no deadline.`,
    refetch: refetchStats,
  });

  const fetchRows = usePagedFetcher(
    ListSupportSlaPoliciesPagedDocument,
    (data: ListSupportSlaPoliciesPagedQuery) => data.listSupportSlaPoliciesPaged,
  );

  const summary = slaData?.supportSlaSummary;
  const statItems: StatItem[] = [
    {
      label: 'Policies',
      value: String(statTotal(statsData?.listSupportSlaPoliciesStats)),
      accent: color.blue[400],
    },
    { label: 'On track', value: String(summary?.onTrack ?? 0), accent: color.green[500] },
    { label: 'Due soon', value: String(summary?.dueSoon ?? 0), accent: color.amber[500] },
    { label: 'Breached', value: String(summary?.breached ?? 0), accent: color.rose[500] },
  ];

  const gridContext: SlaPoliciesGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard<SlaPolicyRow, PagedSlaPolicyRow>
      title="SLA Policies"
      subtitle="What support promises for each priority"
      entityLabel="policy"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <SlaPolicyForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={SLA_POLICY_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search policies…"
    />
  );
}
