import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListPoliciesStatsQuery,
  useDeletePolicyMutation,
  usePublishPolicyMutation,
  ListPoliciesPagedDocument,
  type ListPoliciesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { PolicyForm, type PolicyRow } from './forms/policy';
import { PolicySignersDialog } from './PolicySignersDialog';
import { POLICY_COLUMNS, type PagedPolicyRow, type PoliciesGridContext } from './policies-grid';

/**
 * Legal → Policies: the company's policies, who they are for, and who has signed them.
 *
 * Publishing asks one question — has the wording changed? — because that is the only thing
 * that decides whether everybody has to sign again.
 */
export function PoliciesPage() {
  const { data: statsData, refetch: refetchStats } = useListPoliciesStatsQuery();
  const [deletePolicy] = useDeletePolicyMutation();
  const [publishPolicy] = usePublishPolicyMutation();
  const [signersFor, setSignersFor] = useState<PagedPolicyRow | null>(null);
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();

  const crud = useCrudResource<PolicyRow, PagedPolicyRow>({
    label: 'Policy',
    onDelete: (row) => deletePolicy({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete "${row.title}"? Signatures against it are deleted too.`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListPoliciesPagedDocument,
    (data: ListPoliciesPagedQuery) => data.listPoliciesPaged,
  );

  const stats = statsData?.listPoliciesStats;
  const statItems: StatItem[] = [
    { label: 'Policies', value: String(statTotal(stats)), accent: '#4f8cff' },
    {
      label: 'Published',
      value: String(statCount(stats, 'status', 'PUBLISHED')),
      accent: '#22c55e',
    },
    { label: 'Drafts', value: String(statCount(stats, 'status', 'DRAFT')), accent: '#f9851f' },
    { label: 'Public', value: String(statCount(stats, 'audience', 'PUBLIC')), accent: '#8b5cf6' },
  ];

  const publish = async (row: PagedPolicyRow) => {
    const isRepublish = row.status === 'PUBLISHED';
    const message = isRepublish
      ? `Has the wording of "${row.title}" changed? Choosing yes makes it v${row.version + 1} and asks everybody to sign again.`
      : `Publish "${row.title}"? Staff will be able to read it straight away.`;
    const ok = await confirm({
      message,
      confirmText: isRepublish ? 'Yes, new version' : 'Publish',
    });
    if (!ok) return;
    try {
      await publishPolicy({ variables: { id: row.id, raiseVersion: isRepublish } });
      await refetchStats();
      crud.onDone();
      notify(isRepublish ? 'Published as a new version' : 'Policy published');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not publish', 'error');
    }
  };

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
      title="Policies"
      subtitle="What the company asks of people, and who has agreed to it"
      entityLabel="policy"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <PolicyForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={POLICY_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by title, slug or owner…"
      extraDialogs={<PolicySignersDialog policy={signersFor} onClose={() => setSignersFor(null)} />}
    />
  );
}
