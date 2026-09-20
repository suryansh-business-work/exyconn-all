import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListPoliciesStatsQuery,
  useDeletePolicyMutation,
  ListPoliciesPagedDocument,
  type ListPoliciesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { PolicyForm, usePublishPolicy, type PolicyRow } from '@exyconn/shell/pages/content-forms';
import { PolicySignersDialog } from './PolicySignersDialog';
import { POLICY_COLUMNS, type PagedPolicyRow, type PoliciesGridContext } from './policies-grid';
import { color } from '@exyconn/shell/components/ui';

/**
 * Legal → Policies: the company's policies, who they are for, and who has signed them.
 *
 * Publishing asks one question — has the wording changed? — because that is the only thing
 * that decides whether everybody has to sign again.
 */
export function PoliciesPage() {
  const { data: statsData, refetch: refetchStats } = useListPoliciesStatsQuery();
  const [deletePolicy] = useDeletePolicyMutation();
  const [signersFor, setSignersFor] = useState<PagedPolicyRow | null>(null);
  const { formatDate } = useSettings();

  const crud = useCrudResource<PolicyRow, PagedPolicyRow>({
    label: 'Policy',
    onDelete: (row) => deletePolicy({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete "{title}"? Signatures against it are deleted too.',
      values: { title: row.title },
    }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListPoliciesPagedDocument,
    (data: ListPoliciesPagedQuery) => data.listPoliciesPaged,
  );

  const stats = statsData?.listPoliciesStats;
  const statItems: StatItem[] = [
    { label: 'Policies', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Published',
      value: String(statCount(stats, 'status', 'PUBLISHED')),
      accent: color.green[500],
    },
    {
      label: 'Drafts',
      value: String(statCount(stats, 'status', 'DRAFT')),
      accent: color.orange[500],
    },
    {
      label: 'Public',
      value: String(statCount(stats, 'audience', 'PUBLIC')),
      accent: color.violet[400],
    },
  ];

  const publish = usePublishPolicy(async () => {
    await refetchStats();
    crud.onDone();
  });

  const gridContext: PoliciesGridContext = {
    actions: {
      publish,
      signers: setSignersFor,
      edit: crud.openEdit,
      delete: crud.remove,
    },
    formatDate,
  };

  return (
    <CrudDashboard
      exportFileName="policies"
      title="Policies"
      subtitle="What the company asks of people, and who has agreed to it"
      entityLabel="policy"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <PolicyForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      permissionModule="Policy"
      columnDefs={POLICY_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by title, slug or owner…"
      extraDialogs={<PolicySignersDialog policy={signersFor} onClose={() => setSignersFor(null)} />}
    />
  );
}
