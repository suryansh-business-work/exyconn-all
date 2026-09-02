import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListContractsStatsQuery,
  useDeleteContractMutation,
  ListContractsPagedDocument,
  type ListContractsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ContractForm, type ContractRow } from './forms/contract';
import { SendContractForm } from './forms/send-contract';
import {
  CONTRACT_COLUMNS,
  type PagedContractRow,
  type ContractsGridContext,
} from './contract-grid';

/** Legal → Contracts: contract CRUD plus emailing a contract to a counterparty. */
export function ContractsPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListContractsStatsQuery();
  const [deleteContract] = useDeleteContractMutation();
  const [sendTarget, setSendTarget] = useState<ContractRow | null>(null);
  const { formatDate } = useSettings();
  const crud = useCrudResource<ContractRow, PagedContractRow>({
    label: 'Contract',
    onDelete: (row) => deleteContract({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete contract "${row.title}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListContractsPagedDocument,
    (data: ListContractsPagedQuery) => data.listContractsPaged,
  );

  const stats = statsData?.listContractsStats;
  // "Signed" counts contracts whose nullable `signedBy` is set = total minus the null bucket.
  const signed = statTotal(stats) - statCount(stats, 'signedBy', 'null');
  const statItems: StatItem[] = [
    { label: 'Total', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Active', value: String(statCount(stats, 'status', 'ACTIVE')), accent: '#22c55e' },
    { label: 'Draft', value: String(statCount(stats, 'status', 'DRAFT')), accent: '#f59e0b' },
    { label: 'Signed', value: String(signed), accent: '#8b5cf6' },
  ];

  const gridContext: ContractsGridContext = {
    actions: { edit: crud.openEdit, send: setSendTarget, delete: crud.remove },
    formatDate,
  };

  const closeSend = () => setSendTarget(null);

  return (
    <CrudDashboard
      title="Contracts"
      subtitle="Create, send & track contracts"
      entityLabel="contract"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ContractForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={CONTRACT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search contracts…"
      extraDialogs={
        <CrudDialog open={Boolean(sendTarget)} title="Send contract" onClose={closeSend}>
          {sendTarget && (
            <SendContractForm
              contract={sendTarget}
              onCancel={closeSend}
              onDone={() => {
                crud.reload();
                closeSend();
              }}
            />
          )}
        </CrudDialog>
      }
    />
  );
}
