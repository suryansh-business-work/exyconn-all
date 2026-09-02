import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListContractsQuery,
  useListLegalDocumentsQuery,
} from '@exyconn/shell/graphql/generated';
import type { ContractRow } from './forms/contract';

/** Legal → Dashboard: a real-count overview of contracts and documents. */
export function LegalDashboardPage() {
  const { data: contractsData, loading } = useListContractsQuery();
  const { data: documentsData } = useListLegalDocumentsQuery();
  const { formatDate } = useSettings();

  const contracts = contractsData?.listContracts ?? [];
  const documents = documentsData?.listLegalDocuments ?? [];
  const stats: StatItem[] = [
    { label: 'Contracts', value: String(contracts.length), accent: '#4f8cff' },
    {
      label: 'Active',
      value: String(contracts.filter((r) => r.status === 'ACTIVE').length),
      accent: '#22c55e',
    },
    {
      label: 'Signed',
      value: String(contracts.filter((r) => r.signedBy).length),
      accent: '#8b5cf6',
    },
    { label: 'Documents', value: String(documents.length), accent: '#f59e0b' },
  ];

  const columns: Column<ContractRow>[] = [
    { key: 'title', label: 'Title' },
    { key: 'party', label: 'Party' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'expiryDate', label: 'Expires', render: (r) => formatDate(r.expiryDate) },
  ];

  return (
    <ModuleDashboard title="Legal" subtitle="Contracts & documents overview" stats={stats}>
      <DataTable
        columns={columns}
        rows={contracts.slice(0, 8)}
        emptyMessage={loading ? 'Loading…' : 'No contracts yet.'}
      />
    </ModuleDashboard>
  );
}
