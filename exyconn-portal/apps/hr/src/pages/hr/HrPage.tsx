import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudResource } from '@exyconn/crud';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListLeaveRequestsQuery,
  useDeleteLeaveRequestMutation,
} from '@exyconn/shell/graphql/generated';
import { useEmployeeNames } from '../../hooks/useEmployeeNames';
import { LeaveRequestForm, type LeaveRequestRow } from './forms/leave-request';
import { LeaveDecisionCell, useLeaveDecision } from './leave-actions';
import { color } from '@exyconn/shell/components/ui';

/** HR Leave Requests — apply, approve & track leave (real counts). */
export function HrPage() {
  const { data, loading, refetch } = useListLeaveRequestsQuery();
  const nameOf = useEmployeeNames();
  const [deleteLeaveRequest] = useDeleteLeaveRequestMutation();
  const decide = useLeaveDecision(refetch);
  const navigate = useNavigate();
  const crud = useCrudResource<LeaveRequestRow>({
    label: 'Leave request',
    onDelete: (row) => deleteLeaveRequest({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this leave request?',
    refetch,
  });
  const { formatDate } = useSettings();

  const rows = data?.listLeaveRequests ?? [];

  const stats: StatItem[] = [
    { label: 'Requests', value: String(rows.length), accent: color.blue[400] },
    {
      label: 'Pending',
      value: String(rows.filter((r) => r.status === 'PENDING').length),
      accent: color.amber[400],
    },
    {
      label: 'Approved',
      value: String(rows.filter((r) => r.status === 'APPROVED').length),
      accent: color.green[300],
    },
    {
      label: 'Rejected',
      value: String(rows.filter((r) => r.status === 'REJECTED').length),
      accent: color.red[200],
    },
  ];

  const columns: Column<LeaveRequestRow>[] = [
    { key: 'employeeId', label: 'Employee', render: (r) => nameOf(r.employeeId) },
    { key: 'type', label: 'Type', render: (r) => <StatusChip value={r.type} /> },
    { key: 'fromDate', label: 'From', render: (r) => formatDate(r.fromDate) },
    { key: 'toDate', label: 'To', render: (r) => formatDate(r.toDate) },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    {
      key: 'decision',
      label: 'Decision',
      render: (r) => <LeaveDecisionCell row={r} onDecide={decide} />,
    },
  ];

  if (crud.open) {
    return (
      <CrudFormPage
        title={crud.editing ? 'Edit request' : 'New request'}
        onBack={crud.close}
        backLabel="Back to Leave Requests"
      >
        <LeaveRequestForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <ModuleDashboard
      title="Leave Requests"
      subtitle="Apply, approve & track leave"
      actionLabel="New request"
      onAction={crud.openCreate}
      stats={stats}
    >
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={(row) => navigate(`/hr/employees/${row.employeeId}`)}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage={loading ? 'Loading…' : 'No leave requests yet.'}
      />
    </ModuleDashboard>
  );
}
