import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import { useT } from '@exyconn/i18n';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListCampaignsStatsQuery,
  useDeleteCampaignMutation,
  ListCampaignsPagedDocument,
  type ListCampaignsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import type { CampaignRow } from './forms/campaign';
import { studioPath } from './CampaignStudioPage';
import { CampaignDetails } from './CampaignDetails';
import { color } from '@exyconn/shell/components/ui';
import {
  CAMPAIGN_COLUMNS,
  type PagedCampaignRow,
  type CampaignsGridContext,
} from './campaigns-grid';

/** Marketing module — campaign dashboard with a server-side campaigns grid and email send. */
export function MarketingPage() {
  const t = useT();
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const {
    data: statsData,
    loading: statsLoading,
    refetch: refetchStats,
  } = useListCampaignsStatsQuery();
  const [deleteCampaign] = useDeleteCampaignMutation();
  const [detailsTarget, setDetailsTarget] = useState<CampaignRow | null>(null);
  const navigate = useNavigate();
  const { formatDate } = useSettings();
  const crud = useCrudResource<CampaignRow, PagedCampaignRow>({
    label: 'Campaign',
    onDelete: (row) => deleteCampaign({ variables: { id: row.id } }),
    confirmMessage: (row) => ({ message: 'Delete campaign "{name}"?', values: { name: row.name } }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListCampaignsPagedDocument,
    (data: ListCampaignsPagedQuery) => data.listCampaignsPaged,
  );

  const stats = statsData?.listCampaignsStats;
  // "Sent" counts campaigns whose nullable `lastSentAt` is set = total minus the null bucket.
  const sent = statTotal(stats) - statCount(stats, 'lastSentAt', 'null');
  const statItems: StatItem[] = [
    { label: 'Campaigns', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Active',
      value: String(statCount(stats, 'status', 'ACTIVE')),
      accent: color.green[300],
    },
    {
      label: 'Total budget',
      value: `₹${statSum(stats, 'budget').toLocaleString()}`,
      accent: color.pink[400],
    },
    { label: 'Sent', value: String(sent), accent: color.orange[500] },
  ];

  const gridContext: CampaignsGridContext = {
    actions: {
      view: setDetailsTarget,
      send: (row) => navigate(studioPath(row.id, 'review')),
      edit: (row) => navigate(studioPath(row.id)),
      delete: crud.remove,
    },
    formatDate,
  };

  const closeDetails = () => setDetailsTarget(null);

  return (
    <CrudDashboard
      exportFileName="campaigns"
      title="Campaigns"
      subtitle="Email campaigns, from draft to delivery"
      entityLabel="campaign"
      stats={statItems}
      statsLoading={!statsData && statsLoading}
      crud={crud}
      // Creating opens the Email Campaign Studio on its own page.
      renderForm={(initial) => <Navigate to={studioPath(initial?.id ?? null)} replace />}
      columnDefs={CAMPAIGN_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search campaigns…"
      extraDialogs={
        <CrudDialog
          open={Boolean(detailsTarget)}
          title={t('Campaign details')}
          onClose={closeDetails}
        >
          {detailsTarget && <CampaignDetails campaign={detailsTarget} />}
        </CrudDialog>
      }
    />
  );
}
