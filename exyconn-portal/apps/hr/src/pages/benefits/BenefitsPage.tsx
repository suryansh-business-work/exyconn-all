import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListBenefitsStatsQuery,
  useDeleteBenefitMutation,
  ListBenefitsPagedDocument,
  type ListBenefitsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { BenefitForm, type BenefitRow } from './forms/benefit';
import { BENEFIT_COLUMNS, type PagedBenefitRow, type BenefitGridContext } from './benefit-grid';

/** Benefits — server-paged admin grid over the benefit records. */
export function BenefitsPage() {
  const { data: statsData, refetch: refetchStats } = useListBenefitsStatsQuery();
  const [deleteBenefit] = useDeleteBenefitMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<BenefitRow, PagedBenefitRow>({
    label: 'Benefit',
    onDelete: (row) => deleteBenefit({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this benefit?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListBenefitsPagedDocument,
    (data: ListBenefitsPagedQuery) => data.listBenefitsPaged,
  );

  const stats = statsData?.listBenefitsStats;
  const statItems: StatItem[] = [
    { label: 'Benefits', value: String(statTotal(stats)), accent: '#16a34a' },
    { label: 'Insurance', value: String(statCount(stats, 'kind', 'INSURANCE')), accent: '#16a34a' },
    { label: 'PF', value: String(statCount(stats, 'kind', 'PF')), accent: '#16a34a' },
    { label: 'Wellness', value: String(statCount(stats, 'kind', 'WELLNESS')), accent: '#16a34a' },
  ];

  const gridContext: BenefitGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Benefits"
      subtitle="Insurance, PF and other benefits"
      entityLabel="benefit"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <BenefitForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={BENEFIT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search benefits…"
    />
  );
}
