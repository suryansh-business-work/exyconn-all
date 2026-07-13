import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex } from '@/components/ui';
import LockResetIcon from '@mui/icons-material/LockReset';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import {
  Role,
  useListUsersQuery,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
} from '../../../graphql/generated';
import { UserForm, type UserRow } from './forms/user';
import { userStatus } from './UserDetails/user-details.types';
import { CredentialsDialog, type Credentials } from './CredentialsDialog';

/** Admin module — user management dashboard. */
export function AdminPage() {
  const { data, loading, refetch } = useListUsersQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [resetPassword] = useResetUserPasswordMutation();
  const dialog = useCrudDialog<UserRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const rows = data?.listUsers ?? [];
  const roles = new Set(rows.flatMap((r) => r.roles)).size;
  const stats: StatItem[] = [
    { label: 'Users', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Active', value: String(rows.filter((r) => r.isActive).length), accent: '#7be37b' },
    {
      label: 'Admins',
      value: String(rows.filter((r) => r.roles.includes(Role.Admin)).length),
      accent: '#f9851f',
    },
    { label: 'Roles in use', value: String(roles), accent: '#8b5cf6' },
  ];

  const columns: Column<UserRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'roles',
      label: 'Roles',
      render: (r) => (
        <Flex direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {r.roles.map((role) => (
            <StatusChip key={role} value={role} />
          ))}
        </Flex>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => <StatusChip value={userStatus(r)} />,
    },
  ];

  const handleDelete = async (row: UserRow) => {
    const ok = await confirm({ message: `Delete user "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteUser({ variables: { id: row.id } });
    await refetch();
    notify('User deleted');
  };

  const handleResetPassword = async (row: UserRow) => {
    const ok = await confirm({
      message: `Reset password for "${row.name}"? A new temporary password will be emailed.`,
      confirmText: 'Reset',
    });
    if (!ok) return;
    try {
      const { data: res } = await resetPassword({ variables: { id: row.id } });
      if (res?.resetUserPassword) {
        setCredentials({ name: row.name, email: row.email, password: res.resetUserPassword });
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Reset failed', 'error');
    }
  };

  return (
    <ModuleDashboard
      title="Admin"
      subtitle="Users & roles"
      actionLabel="New user"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit user' : 'New user'}
          onClose={dialog.close}
        >
          <UserForm
            initial={dialog.editing}
            onCancel={dialog.close}
            onCreated={setCredentials}
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
        onRowClick={(row) => navigate(`/portal/admin/users/${row.id}`)}
        onEdit={dialog.openEdit}
        onDelete={handleDelete}
        actions={[
          {
            icon: <LockResetIcon fontSize="small" />,
            tooltip: 'Reset & copy password',
            ariaLabel: 'reset password',
            onClick: handleResetPassword,
          },
        ]}
        emptyMessage={loading ? 'Loading…' : 'No users yet.'}
      />
      <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
    </ModuleDashboard>
  );
}
