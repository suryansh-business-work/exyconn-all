import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListItChangesPagedDocument,
  useDecideItChangeMutation,
  useDeleteItChangeMutation,
  useListItChangesStatsQuery,
  type ListItChangesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { DecisionDialog, type DecisionValues } from '../../components/decision';
import { ChangeForm, type ChangeRow } from './forms/change';
import { CHANGE_COLUMNS, type ChangesGridContext, type PagedChangeRow } from './changes-grid';

/**
 * IT › Change Management: production changes, their approval, and what happened when they
 * were carried out. Every edit is also in the audit log, so the register is the history.
 */
export function ChangesPage() {
  const { formatDate } = useSettings();
  const [deciding, setDeciding] = useState<PagedChangeRow | null>(null);
  const { data: statsData, refetch: refetchStats } = useListItChangesStatsQuery();
  const [remove] = useDeleteItChangeMutation();
  const [decide] = useDecideItChangeMutation();
  const crud = useCrudResource<ChangeRow, PagedChangeRow>({
    label: 'Change',
    onDelete: (row) => remove({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete change "{title}"?',
      values: { title: row.title },
    }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListItChangesPagedDocument,
    (data: ListItChangesPagedQuery) => data.listItChangesPaged,
  );

  const stats = statsData?.listItChangesStats;
  const statItems: StatItem[] = [
    { label: 'Changes', value: String(statTotal(stats)), accent: color.cyan[600] },
    {
      label: 'Awaiting approval',
      value: String(statCount(stats, 'status', 'PENDING_APPROVAL')),
      accent: color.amber[500],
    },
    {
      label: 'Scheduled',
      value: String(statCount(stats, 'status', 'SCHEDULED')),
      accent: color.blue[400],
    },
    {
      label: 'Failed or rolled back',
      value: String(
        statCount(stats, 'status', 'FAILED') + statCount(stats, 'status', 'ROLLED_BACK'),
      ),
      accent: color.red[500],
    },
  ];

  const gridContext: ChangesGridContext = {
    actions: { decide: setDeciding, edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  const onDecide = ({ decision, note }: DecisionValues) =>
    decide({ variables: { id: deciding?.id ?? '', decision, note } });

  return (
    <CrudDashboard
      title="Change Management"
      subtitle="Production changes, their approval and deployment history"
      entityLabel="change"
      exportFileName="changes"
      permissionModule="ItChange"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ChangeForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={CHANGE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by title, system or owner…"
      extraDialogs={
        <DecisionDialog
          title={deciding?.title ?? null}
          onDecide={onDecide}
          onClose={() => setDeciding(null)}
          onDecided={crud.reload}
        />
      }
    />
  );
}
