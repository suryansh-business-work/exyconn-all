import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ServerDataGrid, type TablePageResult } from '../../../components/data/ServerDataGrid';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import {
  useListLeadsQuery,
  useDeleteLeadMutation,
  ListLeadsPagedDocument,
  type ListLeadsPagedQuery,
  type ListLeadsPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
import { LeadForm, type LeadRow } from './forms/lead';
import { LEAD_COLUMNS, type PagedLeadRow, type LeadsGridContext } from './leads-grid';

/** CRM module — leads & pipeline dashboard with a server-side leads grid. */
export function CrmPage() {
  // Stat cards still summarise all leads; the grid itself is server-paged.
  const { data } = useListLeadsQuery();
  const [deleteLead] = useDeleteLeadMutation();
  const dialog = useCrudDialog<LeadRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listLeads ?? [];
  const pipeline = rows.reduce((sum, r) => sum + r.value, 0);
  const stats: StatItem[] = [
    { label: 'Leads', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Pipeline', value: `₹${pipeline.toLocaleString()}`, accent: '#22c55e' },
    { label: 'Won', value: String(rows.filter((r) => r.stage === 'WON').length), accent: '#7be37b' },
    { label: 'Lost', value: String(rows.filter((r) => r.stage === 'LOST').length), accent: '#ff6b6b' },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

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
      stats={stats}
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
