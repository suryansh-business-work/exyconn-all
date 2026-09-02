import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  Role,
  useListUsersStatsQuery,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
  ListUsersPagedDocument,
  type ListUsersPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { statCount, statDistinct, statTotal } from '@exyconn/shell/components/data/tableStats';
import { UserForm, type UserRow } from '@exyconn/shell/pages/user-forms/user';
import { CredentialsDialog, type Credentials } from './CredentialsDialog';
import { USER_COLUMNS, type PagedUserRow, type UsersGridContext } from './users-grid';

/** Admin module — user management dashboard with a server-side Users grid. */
export function AdminPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListUsersStatsQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [resetPassword] = useResetUserPasswordMutation();
  const confirm = useConfirm();
  const notify = useNotify();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const crud = useCrudResource<UserRow, PagedUserRow>({
    label: 'User',
    onDelete: (row) => deleteUser({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete user "${row.name}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListUsersPagedDocument,
    (data: ListUsersPagedQuery) => data.listUsersPaged,
  );

  const stats = statsData?.listUsersStats;
  const statItems: StatItem[] = [
    { label: 'Users', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Active', value: String(statCount(stats, 'isActive', 'true')), accent: '#7be37b' },
    { label: 'Admins', value: String(statCount(stats, 'roles', Role.Admin)), accent: '#f9851f' },
    { label: 'Roles in use', value: String(statDistinct(stats, 'roles')), accent: '#8b5cf6' },
  ];

  const handleResetPassword = async (row: PagedUserRow) => {
    const ok = await confirm({
      message: `Reset password for "${row.name}"? A new temporary password will be emailed.`,
      confirmText: 'Reset',
    });
    if (!ok) {
      return;
    }
    try {
      const { data: res } = await resetPassword({ variables: { id: row.id } });
      if (res?.resetUserPassword) {
        setCredentials({ name: row.name, email: row.email, password: res.resetUserPassword });
      }
    } catch (err) {
      notify(errorMessage(err, 'Reset failed'), 'error');
    }
  };

  const gridContext: UsersGridContext = {
    actions: { edit: crud.openEdit, reset: handleResetPassword, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Admin"
      subtitle="Users & roles"
      entityLabel="user"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <UserForm
          initial={initial}
          onCancel={crud.close}
          onCreated={setCredentials}
          onDone={crud.onDone}
        />
      )}
      columnDefs={USER_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
      searchPlaceholder="Search users…"
    >
      <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
    </CrudDashboard>
  );
}
