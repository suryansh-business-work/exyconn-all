import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListOnboardingChecklistsPagedDocument,
  useDeleteOnboardingChecklistMutation,
  useListOnboardingChecklistsStatsQuery,
  type ListOnboardingChecklistsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { StartOnboardingForm } from './forms/start-onboarding';
import { OnboardingDetailDrawer } from './OnboardingDetailDrawer';
import {
  ONBOARDING_COLUMNS,
  type OnboardingGridContext,
  type PagedOnboardingChecklistRow,
} from './onboarding-grid';

/**
 * HR › Onboarding — every joiner's checklist, and how far through it they are.
 *
 * A row opens the checklist itself: the grid answers "who still needs chasing", the drawer
 * answers "what for".
 */
export function OnboardingPage() {
  const { formatDate } = useSettings();
  const { data: statsData, refetch: refetchStats } = useListOnboardingChecklistsStatsQuery();
  const [deleteChecklist] = useDeleteOnboardingChecklistMutation();
  const [viewing, setViewing] = useState<PagedOnboardingChecklistRow | null>(null);

  const crud = useCrudResource<PagedOnboardingChecklistRow>({
    label: 'Onboarding checklist',
    onDelete: (row) => deleteChecklist({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete ${row.employeeName}'s onboarding checklist?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListOnboardingChecklistsPagedDocument,
    (data: ListOnboardingChecklistsPagedQuery) => data.listOnboardingChecklistsPaged,
  );

  const stats = statsData?.listOnboardingChecklistsStats;
  const statItems: StatItem[] = [
    { label: 'Onboardings', value: String(statTotal(stats)), accent: '#64748b' },
  ];

  const gridContext: OnboardingGridContext = {
    actions: { details: setViewing, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Onboarding"
      subtitle="Every joiner's first days, and what is still outstanding"
      entityLabel="onboarding"
      actionLabel="Start onboarding"
      stats={statItems}
      crud={crud}
      renderForm={() => <StartOnboardingForm onCancel={crud.close} onDone={crud.onDone} />}
      columnDefs={ONBOARDING_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      onRowClick={setViewing}
      searchPlaceholder="Search by employee or template…"
      extraDialogs={
        <OnboardingDetailDrawer
          checklist={viewing}
          onClose={() => setViewing(null)}
          onChanged={(updated) => {
            // The drawer stays open on the freshly-returned checklist: HR ticks several
            // tasks in a row, and re-opening it after each one would be the whole job again.
            setViewing(updated);
            crud.reload();
          }}
        />
      }
    />
  );
}
