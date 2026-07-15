import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ServerDataGrid, type TablePageResult } from '../../../components/data/ServerDataGrid';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import {
  useListCampaignsQuery,
  useDeleteCampaignMutation,
  ListCampaignsPagedDocument,
  type ListCampaignsPagedQuery,
  type ListCampaignsPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
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
  // Stat cards still summarise all campaigns; the grid itself is server-paged.
  const { data } = useListCampaignsQuery();
  const [deleteCampaign] = useDeleteCampaignMutation();
  const dialog = useCrudDialog<CampaignRow>();
  const [detailsTarget, setDetailsTarget] = useState<CampaignRow | null>(null);
  const [sendTarget, setSendTarget] = useState<CampaignRow | null>(null);
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listCampaigns ?? [];
  const budget = rows.reduce((sum, r) => sum + r.budget, 0);
  const stats: StatItem[] = [
    { label: 'Campaigns', value: String(rows.length), accent: '#4f8cff' },
    {
      label: 'Active',
      value: String(rows.filter((r) => r.status === 'ACTIVE').length),
      accent: '#7be37b',
    },
    { label: 'Total budget', value: `₹${budget.toLocaleString()}`, accent: '#ec4899' },
    {
      label: 'Sent',
      value: String(rows.filter((r) => r.lastSentAt).length),
      accent: '#f9851f',
    },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedCampaignRow>> => {
      const result = await client.query<ListCampaignsPagedQuery, ListCampaignsPagedQueryVariables>({
        query: ListCampaignsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listCampaignsPaged.rows,
        totalCount: result.data.listCampaignsPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedCampaignRow) => {
    const ok = await confirm({ message: `Delete campaign "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteCampaign({ variables: { id: row.id } });
    reload();
    notify('Campaign deleted');
  };

  const gridContext: CampaignsGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
    onViewDetails: setDetailsTarget,
    onSend: setSendTarget,
    formatDate,
  };

  return (
    <ModuleDashboard
      title="Marketing"
      subtitle="Campaigns"
      actionLabel="New campaign"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <>
          <CrudDialog
            open={dialog.open}
            title={dialog.editing ? 'Edit campaign' : 'New campaign'}
            onClose={dialog.close}
          >
            <CampaignForm
              initial={dialog.editing}
              onCancel={dialog.close}
              onDone={() => {
                reload();
                dialog.close();
              }}
            />
          </CrudDialog>

          <CrudDialog
            open={Boolean(detailsTarget)}
            title="Campaign details"
            onClose={() => setDetailsTarget(null)}
          >
            {detailsTarget && <CampaignDetails campaign={detailsTarget} />}
          </CrudDialog>

          <CrudDialog
            open={Boolean(sendTarget)}
            title="Send campaign"
            onClose={() => setSendTarget(null)}
          >
            {sendTarget && (
              <SendCampaignForm
                campaign={sendTarget}
                onCancel={() => setSendTarget(null)}
                onDone={() => {
                  reload();
                  setSendTarget(null);
                }}
              />
            )}
          </CrudDialog>
        </>
      }
    >
      <ServerDataGrid<PagedCampaignRow>
        columnDefs={CAMPAIGN_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search campaigns…"
      />
    </ModuleDashboard>
  );
}
