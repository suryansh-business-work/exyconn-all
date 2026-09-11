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
import { color } from '@exyconn/shell/components/ui';

/** Legal → Dashboard: a real-count overview of contracts and documents. */
export function LegalDashboardPage() {
  const { data: contractsData, loading, refetch } = useListContractsQuery();
  const { data: documentsData } = useListLegalDocumentsQuery();
  const { formatDate } = useSettings();

  const contracts = contractsData?.listContracts ?? [];
  const documents = documentsData?.listLegalDocuments ?? [];
  const stats: StatItem[] = [
    { label: 'Contracts', value: String(contracts.length), accent: color.blue[400] },
    {
      label: 'Active',
      value: String(contracts.filter((r) => r.status === 'ACTIVE').length),
      accent: color.green[500],
    },
    {
      label: 'Signed',
      value: String(contracts.filter((r) => r.signedBy).length),
      accent: color.violet[400],
    },
    { label: 'Documents', value: String(documents.length), accent: color.amber[500] },
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
        emptyMessage="No contracts yet."
        loading={loading}
        onRefresh={refetch}
      />
    </ModuleDashboard>
  );
}
