import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import { useT } from '@exyconn/i18n';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { color } from '@exyconn/shell/components/ui';
import {
  useListObjectivesStatsQuery,
  useDeleteObjectiveMutation,
  ListObjectivesPagedDocument,
  type ListObjectivesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ObjectiveForm, type ObjectiveRow } from './forms/objective';
import {
  OBJECTIVE_COLUMNS,
  type PagedObjectiveRow,
  type ObjectivesGridContext,
} from './objectives-grid';

/**
 * The company's own objectives and how they are measured (clause 6.2) — not an employee's
 * appraisal goals, which belong to HR.
 */
export function ObjectivesPage() {
  const t = useT();
  const { data: statsData, refetch } = useListObjectivesStatsQuery();
  const [deleteObjective] = useDeleteObjectiveMutation();
  const { formatDate } = useSettings();
  const crud = useCrudResource<ObjectiveRow, PagedObjectiveRow>({
    label: 'Objective',
    onDelete: (row) => deleteObjective({ variables: { id: row.id } }),
    confirmMessage: (row) => t('Delete objective "{title}"?', { title: row.title }),
    refetch,
  });
  const fetchRows = usePagedFetcher(
    ListObjectivesPagedDocument,
    (data: ListObjectivesPagedQuery) => data.listObjectivesPaged,
  );

  const stats = statsData?.listObjectivesStats;
  const statItems: StatItem[] = [
    { label: 'Objectives', value: String(statTotal(stats)), accent: color.teal[600] },
    {
      label: 'On track',
      value: String(statCount(stats, 'status', 'ON_TRACK')),
      accent: color.green[300],
    },
    {
      label: 'At risk',
      value: String(statCount(stats, 'status', 'AT_RISK')),
      accent: color.orange[500],
    },
    { label: 'Met', value: String(statCount(stats, 'status', 'MET')), accent: color.blue[400] },
  ];

  const gridContext: ObjectivesGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Objectives"
      subtitle="What the company set itself, how it is measured and where it has got to"
      entityLabel="objective"
      exportFileName="objectives"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ObjectiveForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={OBJECTIVE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by objective, measure, area or owner…"
    />
  );
}
