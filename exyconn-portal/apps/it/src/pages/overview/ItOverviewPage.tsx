import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListAssetsQuery,
  useListAssetsStatsQuery,
  useListLicencesQuery,
} from '@exyconn/shell/graphql/generated';
import type { AssetRow } from '../assets/forms/asset';
import { renewalsDueWithin } from '../licences';
import { RENEWAL_WINDOW_DAYS } from '../licences/licences.constants';
import { color } from '@exyconn/shell/components/ui';

/** How many assets the overview lists before sending you to the register. */
const RECENT_ASSETS = 8;
/** A warranty inside this window is worth chasing before it lapses. */
const WARRANTY_WARNING_DAYS = 60;

/** True when the warranty runs out within the warning window (or already has). */
function warrantyEndingSoon(asset: { warrantyExpiry?: string | null }): boolean {
  if (!asset.warrantyExpiry) {
    return false;
  }
  const days = (new Date(asset.warrantyExpiry).getTime() - Date.now()) / 86_400_000;
  return days <= WARRANTY_WARNING_DAYS;
}

/** IT → Overview: what the company owns, who holds it, and what needs attention. */
export function ItOverviewPage() {
  const { data: statsData } = useListAssetsStatsQuery();
  const { data: assetsData, loading, refetch } = useListAssetsQuery();
  const { data: licencesData } = useListLicencesQuery();
  const { formatDate } = useSettings();

  const stats = statsData?.listAssetsStats;
  const assets = assetsData?.listAssets ?? [];
  const expiring = assets.filter(warrantyEndingSoon);
  const licences = licencesData?.listLicences ?? [];
  const renewing = renewalsDueWithin(licences, RENEWAL_WINDOW_DAYS);

  const statItems: StatItem[] = [
    { label: 'Assets', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Assigned',
      value: String(statCount(stats, 'status', 'ASSIGNED')),
      accent: color.green[500],
    },
    { label: 'Licences', value: String(licences.length), accent: color.cyan[600] },
    {
      label: `Renews in ${RENEWAL_WINDOW_DAYS}d`,
      value: String(renewing.length),
      accent: color.amber[500],
    },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'By status',
      buckets: stats?.counts.find((c) => c.field === 'status')?.buckets ?? [],
      accent: color.blue[400],
    },
    {
      title: 'By category',
      buckets: stats?.counts.find((c) => c.field === 'category')?.buckets ?? [],
      accent: color.violet[400],
    },
  ];

  const columns: Column<AssetRow>[] = [
    { key: 'assetTag', label: 'Tag' },
    { key: 'name', label: 'Asset' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'assignedToName', label: 'Assigned to' },
    { key: 'warrantyExpiry', label: 'Warranty ends', render: (r) => formatDate(r.warrantyExpiry) },
  ];

  const rows = expiring.length > 0 ? expiring : assets;

  return (
    <ModuleOverview
      title="IT"
      subtitle="Company hardware & licences at a glance"
      stats={statItems}
      breakdowns={breakdowns}
      links={[
        { label: 'Open asset register', to: '/it/assets' },
        { label: 'Open licences', to: '/it/licences' },
      ]}
      recentTitle={expiring.length > 0 ? 'Warranty ending soon' : 'Newest assets'}
    >
      <DataTable
        columns={columns}
        rows={rows.slice(0, RECENT_ASSETS)}
        emptyMessage="No assets yet."
        loading={loading}
        onRefresh={refetch}
      />
    </ModuleOverview>
  );
}
