import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListEmployeeRequestsStatsQuery,
  useDeleteEmployeeRequestMutation,
  ListEmployeeRequestsPagedDocument,
  type ListEmployeeRequestsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { EmployeeRequestForm, type EmployeeRequestRow } from './forms/employee-request';
import {
  EMPLOYEE_REQUEST_COLUMNS,
  type PagedEmployeeRequestRow,
  type EmployeeRequestGridContext,
} from './employee-request-grid';

/** Employee Requests — server-paged admin grid over the request records. */
export function RequestsPage() {
  const { data: statsData, refetch: refetchStats } = useListEmployeeRequestsStatsQuery();
  const [deleteEmployeeRequest] = useDeleteEmployeeRequestMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<EmployeeRequestRow, PagedEmployeeRequestRow>({
    label: 'EmployeeRequest',
    onDelete: (row) => deleteEmployeeRequest({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this request?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListEmployeeRequestsPagedDocument,
    (data: ListEmployeeRequestsPagedQuery) => data.listEmployeeRequestsPaged,
  );

  const stats = statsData?.listEmployeeRequestsStats;
  const statItems: StatItem[] = [
    { label: 'Requests', value: String(statTotal(stats)), accent: '#f97316' },
    { label: 'Pending', value: String(statCount(stats, 'status', 'PENDING')), accent: '#f97316' },
    { label: 'Approved', value: String(statCount(stats, 'status', 'APPROVED')), accent: '#f97316' },
    { label: 'Rejected', value: String(statCount(stats, 'status', 'REJECTED')), accent: '#f97316' },
  ];

  const gridContext: EmployeeRequestGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Employee Requests"
      subtitle="WFH, regularisation and other HR requests"
      entityLabel="request"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <EmployeeRequestForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={EMPLOYEE_REQUEST_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search requests…"
    />
  );
}
