import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  ProblemStatus,
  ProblemSeverity,
  useListProblemReportsStatsQuery,
  useDeleteProblemReportMutation,
  ListProblemReportsPagedDocument,
  type ListProblemReportsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ProblemReportForm, type ProblemReportRow } from './forms/problem-report';
import { color } from '@exyconn/shell/components/ui';
import {
  PROBLEM_REPORT_COLUMNS,
  type PagedProblemReportRow,
  type ProblemReportsGridContext,
} from './problem-reports-grid';

/** Tech module — everything reported from the public status page, waiting for triage. */
export function ProblemReportsPage() {
  const { data: statsData, refetch: refetchStats } = useListProblemReportsStatsQuery();
  const [deleteReport] = useDeleteProblemReportMutation();
  const crud = useCrudResource<ProblemReportRow, PagedProblemReportRow>({
    label: 'Problem report',
    onDelete: (row) => deleteReport({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete report ${row.reference}?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListProblemReportsPagedDocument,
    (data: ListProblemReportsPagedQuery) => data.listProblemReportsPaged,
  );

  const stats = statsData?.listProblemReportsStats;
  const statItems: StatItem[] = [
    { label: 'Reports', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'New',
      value: String(statCount(stats, 'status', ProblemStatus.New)),
      accent: color.orange[500],
    },
    {
      label: 'In progress',
      value: String(statCount(stats, 'status', ProblemStatus.InProgress)),
      accent: color.violet[500],
    },
    {
      label: 'Critical',
      value: String(statCount(stats, 'severity', ProblemSeverity.Critical)),
      accent: color.red[200],
    },
  ];

  const gridContext: ProblemReportsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Problem Reports"
      subtitle="What people told us broke, straight from status.exyconn.com"
      entityLabel="report"
      exportFileName="problem-reports"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ProblemReportForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={PROBLEM_REPORT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by reference, subject or reporter…"
    />
  );
}
