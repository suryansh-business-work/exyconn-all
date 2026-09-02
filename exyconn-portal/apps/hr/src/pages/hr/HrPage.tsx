import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudResource } from '@exyconn/crud';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListLeaveRequestsQuery,
  useDeleteLeaveRequestMutation,
  useListUsersQuery,
} from '@exyconn/shell/graphql/generated';
import { LeaveRequestForm, type LeaveRequestRow } from './forms/leave-request';

/** HR Leave Requests — apply, approve & track leave (real counts). */
export function HrPage() {
  const { data, loading, refetch } = useListLeaveRequestsQuery();
  const { data: usersData } = useListUsersQuery();
  const [deleteLeaveRequest] = useDeleteLeaveRequestMutation();
  const navigate = useNavigate();
  const crud = useCrudResource<LeaveRequestRow>({
    label: 'Leave request',
    onDelete: (row) => deleteLeaveRequest({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this leave request?',
    refetch,
  });
  const { formatDate } = useSettings();

  const rows = data?.listLeaveRequests ?? [];
  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    (usersData?.listUsers ?? []).forEach((u) => map.set(u.id, u.name));
    return map;
  }, [usersData]);

  const stats: StatItem[] = [
    { label: 'Requests', value: String(rows.length), accent: '#4f8cff' },
    {
      label: 'Pending',
      value: String(rows.filter((r) => r.status === 'PENDING').length),
      accent: '#f5b324',
    },
    {
      label: 'Approved',
      value: String(rows.filter((r) => r.status === 'APPROVED').length),
      accent: '#7be37b',
    },
    {
      label: 'Rejected',
      value: String(rows.filter((r) => r.status === 'REJECTED').length),
      accent: '#ff6b6b',
    },
  ];

  const columns: Column<LeaveRequestRow>[] = [
    {
      key: 'employeeId',
      label: 'Employee',
      render: (r) => nameById.get(r.employeeId) ?? r.employeeId,
    },
    { key: 'type', label: 'Type', render: (r) => <StatusChip value={r.type} /> },
    { key: 'fromDate', label: 'From', render: (r) => formatDate(r.fromDate) },
    { key: 'toDate', label: 'To', render: (r) => formatDate(r.toDate) },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
  ];

  return (
    <ModuleDashboard
      title="Leave Requests"
      subtitle="Apply, approve & track leave"
      actionLabel="New request"
      onAction={crud.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={crud.open}
          title={crud.editing ? 'Edit request' : 'New request'}
          onClose={crud.close}
        >
          <LeaveRequestForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
        </CrudDialog>
      }
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
