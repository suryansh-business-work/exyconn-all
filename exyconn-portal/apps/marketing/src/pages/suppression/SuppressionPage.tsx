import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListMarketingSuppressionsStatsQuery,
  useDeleteMarketingSuppressionMutation,
  ListMarketingSuppressionsPagedDocument,
  type ListMarketingSuppressionsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { SuppressionForm, type SuppressionRow } from './forms/suppression';
import {
  SUPPRESSION_COLUMNS,
  type PagedSuppressionRow,
  type SuppressionGridContext,
} from './suppression-grid';

/**
 * Marketing → Suppression List: every address no campaign may reach.
 *
 * Deleting a row is how somebody is put back on the list, and it is deliberately the only
 * way — there is no "re-subscribe" button that could be pressed by accident.
 */
export function SuppressionPage() {
  const { data: statsData, refetch: refetchStats } = useListMarketingSuppressionsStatsQuery();
  const [deleteSuppression] = useDeleteMarketingSuppressionMutation();
  const { formatDate } = useSettings();
  const crud = useCrudResource<SuppressionRow, PagedSuppressionRow>({
    label: 'Suppression',
    onDelete: (row) => deleteSuppression({ variables: { id: row.id } }),
    confirmMessage: (row) =>
      `Remove ${row.email} from the suppression list? Campaigns will be able to reach them again.`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListMarketingSuppressionsPagedDocument,
    (data: ListMarketingSuppressionsPagedQuery) => data.listMarketingSuppressionsPaged,
  );

  const stats = statsData?.listMarketingSuppressionsStats;
  const statItems: StatItem[] = [
    { label: 'Suppressed', value: String(statTotal(stats)), accent: '#ef4444' },
    {
      label: 'Unsubscribed',
      value: String(statCount(stats, 'reason', 'UNSUBSCRIBED')),
      accent: '#f9851f',
    },
    { label: 'Bounced', value: String(statCount(stats, 'reason', 'BOUNCED')), accent: '#8b5cf6' },
    {
      label: 'Added by hand',
      value: String(statCount(stats, 'reason', 'MANUAL')),
      accent: '#4f8cff',
    },
  ];

  const gridContext: SuppressionGridContext = {
    actions: { delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Suppression List"
      subtitle="Addresses no campaign may reach"
      entityLabel="address"
      actionLabel="Add address"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <SuppressionForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={SUPPRESSION_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search addresses…"
    />
  );
}
