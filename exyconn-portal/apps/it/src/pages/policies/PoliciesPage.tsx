import type { ColDef } from 'ag-grid-community';
import PublishIcon from '@mui/icons-material/Publish';
import {
  CrudDashboard,
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  useCrudResource,
  usePagedFetcher,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { PolicyForm, usePublishPolicy, type PolicyRow } from '@exyconn/shell/pages/content-forms';
import {
  ListItPoliciesPagedDocument,
  PolicyCategory,
  useDeletePolicyMutation,
  useListPoliciesStatsQuery,
  type ListItPoliciesPagedQuery,
} from '@exyconn/shell/graphql/generated';

type PagedPolicyRow = ListItPoliciesPagedQuery['listItPoliciesPaged']['rows'][number];

/** IT maintains IT and security policies: devices, BYOD, passwords, VPN and security. */
const IT_CATEGORIES = [PolicyCategory.It, PolicyCategory.Security];

const PUBLISH_ACTION: RowActionSpec = {
  key: 'publish',
  label: 'publish',
  icon: PublishIcon,
  hidden: (row: PagedPolicyRow) => row.status === 'ARCHIVED',
};

const COLUMNS: ColDef<PagedPolicyRow>[] = [
  textColumn('title', 'Title'),
  statusColumn('category', 'Category'),
  statusColumn('status', 'Status'),
  derivedColumn('version', 'Version', (row) => `v${row.version}`),
  dateColumn('effectiveDate', 'Effective'),
  dateColumn('nextReviewOn', 'Next review', '—'),
  actionsColumn([PUBLISH_ACTION, EDIT_ACTION, DELETE_ACTION]),
];

/** IT › Policies: IT policy, BYOD, password, device usage, VPN and security policies. */
export function PoliciesPage() {
  const { formatDate } = useSettings();
  const { data: statsData, refetch: refetchStats } = useListPoliciesStatsQuery();
  const [remove] = useDeletePolicyMutation();
  const crud = useCrudResource<PolicyRow, PagedPolicyRow>({
    label: 'Policy',
    onDelete: (row) => remove({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete "{title}"? Signatures against it are deleted too.',
      values: { title: row.title },
    }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListItPoliciesPagedDocument,
    (data: ListItPoliciesPagedQuery) => data.listItPoliciesPaged,
  );
  const publish = usePublishPolicy(async () => {
    await refetchStats();
    crud.onDone();
  });

  const stats = statsData?.listPoliciesStats;
  const statItems: StatItem[] = [
    {
      label: 'IT policies',
      value: String(statCount(stats, 'category', PolicyCategory.It)),
      accent: color.cyan[600],
    },
    {
      label: 'Security policies',
      value: String(statCount(stats, 'category', PolicyCategory.Security)),
      accent: color.violet[400],
    },
  ];
  const gridContext: DatedCrudGridContext<PagedPolicyRow> = {
    actions: { publish, edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Policies"
      subtitle="IT, BYOD, password, device usage, VPN and security policies"
      entityLabel="policy"
      exportFileName="it-policies"
      permissionModule="Policy"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <PolicyForm
          initial={initial}
          categories={IT_CATEGORIES}
          onCancel={crud.close}
          onDone={crud.onDone}
        />
      )}
      columnDefs={COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search policies…"
    />
  );
}
