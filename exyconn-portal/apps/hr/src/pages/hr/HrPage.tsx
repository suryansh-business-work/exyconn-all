import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
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
  const dialog = useCrudDialog<LeaveRequestRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const navigate = useNavigate();
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

  const handleDelete = async (row: LeaveRequestRow) => {
    const ok = await confirm({ message: 'Delete this leave request?', confirmText: 'Delete' });
    if (!ok) return;
    await deleteLeaveRequest({ variables: { id: row.id } });
    await refetch();
    notify('Leave request deleted');
  };

  return (
    <ModuleDashboard
      title="Leave Requests"
      subtitle="Apply, approve & track leave"
      actionLabel="New request"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit request' : 'New request'}
          onClose={dialog.close}
        >
          <LeaveRequestForm
            initial={dialog.editing}
            onCancel={dialog.close}
            onDone={() => {
              void refetch();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={(row) => navigate(`/hr/employees/${row.employeeId}`)}
        onEdit={dialog.openEdit}
        onDelete={handleDelete}
        emptyMessage={loading ? 'Loading…' : 'No leave requests yet.'}
      />
    </ModuleDashboard>
  );
}
