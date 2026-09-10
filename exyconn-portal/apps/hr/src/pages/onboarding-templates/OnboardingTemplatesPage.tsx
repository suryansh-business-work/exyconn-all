import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListOnboardingTemplatesPagedDocument,
  useDeleteOnboardingTemplateMutation,
  useListOnboardingTemplatesStatsQuery,
  type ListOnboardingTemplatesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { OnboardingTemplateForm } from './forms/onboarding-template';
import { color } from '@exyconn/shell/components/ui';
import {
  ONBOARDING_TEMPLATE_COLUMNS,
  type OnboardingTemplatesGridContext,
  type PagedOnboardingTemplateRow,
} from './onboarding-template-grid';

/**
 * HR › Onboarding Templates — the checklists a joiner's onboarding is made from.
 *
 * Editing one never changes a checklist that has already been started: a template is a
 * pattern, and what somebody was actually asked to do is a record.
 */
export function OnboardingTemplatesPage() {
  const { formatDate } = useSettings();
  const { data: statsData, refetch: refetchStats } = useListOnboardingTemplatesStatsQuery();
  const [deleteTemplate] = useDeleteOnboardingTemplateMutation();

  const crud = useCrudResource<PagedOnboardingTemplateRow>({
    label: 'Onboarding template',
    onDelete: (row) => deleteTemplate({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete the "${row.name}" template?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListOnboardingTemplatesPagedDocument,
    (data: ListOnboardingTemplatesPagedQuery) => data.listOnboardingTemplatesPaged,
  );

  const stats = statsData?.listOnboardingTemplatesStats;
  const statItems: StatItem[] = [
    { label: 'Templates', value: String(statTotal(stats)), accent: color.slate[500] },
    {
      label: 'Offered',
      value: String(statCount(stats, 'active', 'true')),
      accent: color.green[300],
    },
    {
      label: 'Retired',
      value: String(statCount(stats, 'active', 'false')),
      accent: color.amber[500],
    },
  ];

  const gridContext: OnboardingTemplatesGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Onboarding Templates"
      subtitle="The checklists a joiner's first days are made from"
      entityLabel="template"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <OnboardingTemplateForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={ONBOARDING_TEMPLATE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search templates…"
    />
  );
}
