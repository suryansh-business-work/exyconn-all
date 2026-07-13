import { useState } from 'react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import { useListCampaignsQuery, useDeleteCampaignMutation } from '../../../graphql/generated';
import { CampaignForm, type CampaignRow } from './forms/campaign';
import { SendCampaignForm } from './forms/send-campaign';
import { CampaignDetails } from './CampaignDetails';

/** Marketing module — campaign dashboard with email send. */
export function MarketingPage() {
  const { data, loading, refetch } = useListCampaignsQuery();
  const [deleteCampaign] = useDeleteCampaignMutation();
  const dialog = useCrudDialog<CampaignRow>();
  const [detailsTarget, setDetailsTarget] = useState<CampaignRow | null>(null);
  const [sendTarget, setSendTarget] = useState<CampaignRow | null>(null);
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();

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

  const columns: Column<CampaignRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'channel', label: 'Channel', render: (r) => <StatusChip value={r.channel} /> },
    { key: 'budget', label: 'Budget', render: (r) => r.budget.toLocaleString() },
    {
      key: 'lastSentAt',
      label: 'Last sent',
      render: (r) => (r.lastSentAt ? formatDate(r.lastSentAt) : '—'),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
  ];

  const handleDelete = async (row: CampaignRow) => {
    const ok = await confirm({ message: `Delete campaign "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteCampaign({ variables: { id: row.id } });
    await refetch();
    notify('Campaign deleted');
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
                void refetch();
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
                  void refetch();
                  setSendTarget(null);
                }}
              />
            )}
          </CrudDialog>
        </>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        onEdit={dialog.openEdit}
        onDelete={handleDelete}
        actions={[
          {
            icon: <VisibilityIcon fontSize="small" />,
            tooltip: 'View details',
            ariaLabel: 'view campaign',
            onClick: setDetailsTarget,
          },
          {
            icon: <SendIcon fontSize="small" />,
            tooltip: 'Send email',
            ariaLabel: 'send campaign',
            color: 'primary',
            onClick: setSendTarget,
          },
        ]}
        emptyMessage={loading ? 'Loading…' : 'No campaigns yet.'}
      />
    </ModuleDashboard>
  );
}
