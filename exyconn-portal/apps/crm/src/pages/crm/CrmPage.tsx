import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import {
  ServerDataGrid,
  type TablePageResult,
} from '@exyconn/shell/components/data/ServerDataGrid';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListLeadsStatsQuery,
  useDeleteLeadMutation,
  ListLeadsPagedDocument,
  type ListLeadsPagedQuery,
  type ListLeadsPagedQueryVariables,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { LeadForm, type LeadRow } from './forms/lead';
import { LEAD_COLUMNS, type PagedLeadRow, type LeadsGridContext } from './leads-grid';

/** CRM module — leads & pipeline dashboard with a server-side leads grid. */
export function CrmPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListLeadsStatsQuery();
  const [deleteLead] = useDeleteLeadMutation();
  const dialog = useCrudDialog<LeadRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const stats = statsData?.listLeadsStats;
  const statItems: StatItem[] = [
    { label: 'Leads', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Pipeline', value: `₹${statSum(stats, 'value').toLocaleString()}`, accent: '#22c55e' },
    { label: 'Won', value: String(statCount(stats, 'stage', 'WON')), accent: '#7be37b' },
    { label: 'Lost', value: String(statCount(stats, 'stage', 'LOST')), accent: '#ff6b6b' },
  ];

  const reload = () => {
    setRefreshSignal((n) => n + 1);
    void refetchStats();
  };

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedLeadRow>> => {
      const result = await client.query<ListLeadsPagedQuery, ListLeadsPagedQueryVariables>({
        query: ListLeadsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listLeadsPaged.rows,
        totalCount: result.data.listLeadsPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedLeadRow) => {
    const ok = await confirm({ message: `Delete lead "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteLead({ variables: { id: row.id } });
    reload();
    notify('Lead deleted');
  };

  const gridContext: LeadsGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
  };

  return (
    <ModuleDashboard
      title="CRM"
      subtitle="Leads & pipeline"
      actionLabel="New lead"
      onAction={dialog.openCreate}
      stats={statItems}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit lead' : 'New lead'}
          onClose={dialog.close}
        >
          <LeadForm
            initial={dialog.editing}
            onCancel={dialog.close}
            onDone={() => {
              reload();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <ServerDataGrid<PagedLeadRow>
        columnDefs={LEAD_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search leads…"
      />
    </ModuleDashboard>
  );
}
