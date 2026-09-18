import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListItCloudResourcesPagedDocument,
  useDeleteItCloudResourceMutation,
  useListItCloudResourcesStatsQuery,
  type ListItCloudResourcesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { CloudResourceForm, type CloudResourceRow } from './forms/cloud-resource';
import { CLOUD_COLUMNS, type CloudGridContext, type PagedCloudResourceRow } from './cloud-grid';

/**
 * IT › Cloud & Infrastructure: servers, Docker hosts, clusters, databases, domains and
 * certificates. The live Docker view stays in Tech › Infrastructure; this is the register of
 * what exists, who owns it, what it costs and when it lapses.
 */
export function CloudPage() {
  const { formatDate, formatCurrency } = useSettings();
  const { data: statsData, refetch: refetchStats } = useListItCloudResourcesStatsQuery();
  const [remove] = useDeleteItCloudResourceMutation();
  const crud = useCrudResource<CloudResourceRow, PagedCloudResourceRow>({
    label: 'Cloud resource',
    onDelete: (row) => remove({ variables: { id: row.id } }),
    confirmMessage: (row) => ({ message: 'Delete "{name}"?', values: { name: row.name } }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListItCloudResourcesPagedDocument,
    (data: ListItCloudResourcesPagedQuery) => data.listItCloudResourcesPaged,
  );

  const stats = statsData?.listItCloudResourcesStats;
  const statItems: StatItem[] = [
    { label: 'Resources', value: String(statTotal(stats)), accent: color.cyan[600] },
    {
      label: 'Production',
      value: String(statCount(stats, 'environment', 'PRODUCTION')),
      accent: color.blue[400],
    },
    {
      label: 'Down or degraded',
      value: String(statCount(stats, 'status', 'DOWN') + statCount(stats, 'status', 'DEGRADED')),
      accent: color.red[500],
    },
    {
      label: 'Monthly cost',
      value: formatCurrency(statSum(stats, 'monthlyCost')),
      accent: color.amber[500],
    },
  ];

  const gridContext: CloudGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Cloud & Infrastructure"
      subtitle="Servers, Docker, Kubernetes, databases, domains and SSL certificates"
      entityLabel="cloud resource"
      exportFileName="cloud-resources"
      permissionModule="ItCloudResource"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <CloudResourceForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={CLOUD_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by name, provider, endpoint or owner…"
    />
  );
}
