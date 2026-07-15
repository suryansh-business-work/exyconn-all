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
  useListContractsQuery,
  useDeleteContractMutation,
  ListContractsPagedDocument,
  type ListContractsPagedQuery,
  type ListContractsPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
import { ContractForm, type ContractRow } from './forms/contract';
import { SendContractForm } from './forms/send-contract';
import {
  CONTRACT_COLUMNS,
  type PagedContractRow,
  type ContractsGridContext,
} from './contract-grid';

/** Legal → Contracts: contract CRUD plus emailing a contract to a counterparty. */
export function ContractsPage() {
  // Stat cards still summarise all contracts; the grid itself is server-paged.
  const { data } = useListContractsQuery();
  const [deleteContract] = useDeleteContractMutation();
  const dialog = useCrudDialog<ContractRow>();
  const [sendTarget, setSendTarget] = useState<ContractRow | null>(null);
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listContracts ?? [];
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const stats: StatItem[] = [
    { label: 'Total', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Active', value: String(count('ACTIVE')), accent: '#22c55e' },
    { label: 'Draft', value: String(count('DRAFT')), accent: '#f59e0b' },
    { label: 'Signed', value: String(rows.filter((r) => r.signedBy).length), accent: '#8b5cf6' },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedContractRow>> => {
      const result = await client.query<ListContractsPagedQuery, ListContractsPagedQueryVariables>({
        query: ListContractsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listContractsPaged.rows,
        totalCount: result.data.listContractsPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedContractRow) => {
    const ok = await confirm({ message: `Delete contract "${row.title}"?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteContract({ variables: { id: row.id } });
    reload();
    notify('Contract deleted');
  };

  const gridContext: ContractsGridContext = {
    onEdit: dialog.openEdit,
    onSend: setSendTarget,
    onDelete: handleDelete,
    formatDate,
  };

  return (
    <ModuleDashboard
      title="Contracts"
      subtitle="Create, send & track contracts"
      actionLabel="New contract"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <>
          <CrudDialog
            open={dialog.open}
            title={dialog.editing ? 'Edit contract' : 'New contract'}
            onClose={dialog.close}
          >
            <ContractForm
              initial={dialog.editing}
              onCancel={dialog.close}
              onDone={() => {
                reload();
                dialog.close();
              }}
            />
          </CrudDialog>
          <CrudDialog
            open={Boolean(sendTarget)}
            title="Send contract"
            onClose={() => setSendTarget(null)}
          >
            {sendTarget && (
              <SendContractForm
                contract={sendTarget}
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
      <ServerDataGrid<PagedContractRow>
        columnDefs={CONTRACT_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search contracts…"
      />
    </ModuleDashboard>
  );
}
