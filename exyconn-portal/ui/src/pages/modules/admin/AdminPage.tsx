import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { ServerDataGrid, type TablePageResult } from '../../../components/data/ServerDataGrid';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import {
  Role,
  useListUsersQuery,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
  ListUsersPagedDocument,
  type ListUsersPagedQuery,
  type ListUsersPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
import { UserForm, type UserRow } from './forms/user';
import { CredentialsDialog, type Credentials } from './CredentialsDialog';
import { USER_COLUMNS, type PagedUserRow, type UsersGridContext } from './users-grid';

/** Admin module — user management dashboard with a server-side Users grid. */
export function AdminPage() {
  // Stat cards still summarise the whole user base; the grid itself is server-paged.
  const { data } = useListUsersQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [resetPassword] = useResetUserPasswordMutation();
  const dialog = useCrudDialog<UserRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const navigate = useNavigate();
  const client = useApolloClient();
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listUsers ?? [];
  const roleCount = new Set(rows.flatMap((r) => r.roles)).size;
  const stats: StatItem[] = [
    { label: 'Users', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Active', value: String(rows.filter((r) => r.isActive).length), accent: '#7be37b' },
    {
      label: 'Admins',
      value: String(rows.filter((r) => r.roles.includes(Role.Admin)).length),
      accent: '#f9851f',
    },
    { label: 'Roles in use', value: String(roleCount), accent: '#8b5cf6' },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedUserRow>> => {
      const result = await client.query<ListUsersPagedQuery, ListUsersPagedQueryVariables>({
        query: ListUsersPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listUsersPaged.rows,
        totalCount: result.data.listUsersPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedUserRow) => {
    const ok = await confirm({ message: `Delete user "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteUser({ variables: { id: row.id } });
    reload();
    notify('User deleted');
  };

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
      notify(err instanceof Error ? err.message : 'Reset failed', 'error');
    }
  };

  const gridContext: UsersGridContext = {
    onEdit: dialog.openEdit,
    onReset: handleResetPassword,
    onDelete: handleDelete,
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
              reload();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <ServerDataGrid<PagedUserRow>
        columnDefs={USER_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        onRowClick={(row) => navigate(`/portal/admin/users/${row.id}`)}
        searchPlaceholder="Search users…"
      />
      <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
    </ModuleDashboard>
  );
}
