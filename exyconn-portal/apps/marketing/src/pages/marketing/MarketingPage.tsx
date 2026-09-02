import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
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
import { CampaignForm, type CampaignRow } from './forms/campaign';
import { SendCampaignForm } from './forms/send-campaign';
import { CampaignDetails } from './CampaignDetails';
import {
  CAMPAIGN_COLUMNS,
  type PagedCampaignRow,
  type CampaignsGridContext,
} from './campaigns-grid';

/** Marketing module — campaign dashboard with a server-side campaigns grid and email send. */
export function MarketingPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListCampaignsStatsQuery();
  const [deleteCampaign] = useDeleteCampaignMutation();
  const [detailsTarget, setDetailsTarget] = useState<CampaignRow | null>(null);
  const [sendTarget, setSendTarget] = useState<CampaignRow | null>(null);
  const { formatDate } = useSettings();
  const crud = useCrudResource<CampaignRow, PagedCampaignRow>({
    label: 'Campaign',
    onDelete: (row) => deleteCampaign({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete campaign "${row.name}"?`,
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
    { label: 'Campaigns', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Active', value: String(statCount(stats, 'status', 'ACTIVE')), accent: '#7be37b' },
    {
      label: 'Total budget',
      value: `₹${statSum(stats, 'budget').toLocaleString()}`,
      accent: '#ec4899',
    },
    { label: 'Sent', value: String(sent), accent: '#f9851f' },
  ];

  const gridContext: CampaignsGridContext = {
    actions: {
      view: setDetailsTarget,
      send: setSendTarget,
      edit: crud.openEdit,
      delete: crud.remove,
    },
    formatDate,
  };

  const closeDetails = () => setDetailsTarget(null);
  const closeSend = () => setSendTarget(null);

  return (
    <CrudDashboard
      title="Marketing"
      subtitle="Campaigns"
      entityLabel="campaign"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <CampaignForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={CAMPAIGN_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search campaigns…"
      extraDialogs={
        <>
          <CrudDialog open={Boolean(detailsTarget)} title="Campaign details" onClose={closeDetails}>
            {detailsTarget && <CampaignDetails campaign={detailsTarget} />}
          </CrudDialog>

          <CrudDialog open={Boolean(sendTarget)} title="Send campaign" onClose={closeSend}>
            {sendTarget && (
              <SendCampaignForm
                campaign={sendTarget}
                onCancel={closeSend}
                onDone={() => {
                  crud.reload();
                  closeSend();
                }}
              />
            )}
          </CrudDialog>
        </>
      }
    />
  );
}
