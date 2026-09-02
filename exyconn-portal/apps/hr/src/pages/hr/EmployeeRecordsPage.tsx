import { useNavigate } from 'react-router-dom';
import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { ROLES } from '@exyconn/shell/auth/roles';
import { useListUsersQuery } from '@exyconn/shell/graphql/generated';
import { UserForm, type UserRow } from '@exyconn/shell/pages/user-forms/user';
import { userStatus } from '@exyconn/shell/pages/UserDetails/user-details.types';

/** HR Employee Records — workforce directory; row click opens the detail screen. */
export function EmployeeRecordsPage() {
  const { data, loading, refetch } = useListUsersQuery({ fetchPolicy: 'cache-and-network' });
  const navigate = useNavigate();
  const { formatDate } = useSettings();
  const { user } = useAuth();
  const dialog = useCrudDialog<UserRow>();
  // New employee creation provisions an account (welcome email) — ADMIN only.
  const canCreate = user?.roles.includes(ROLES.ADMIN) ?? false;

  const rows = data?.listUsers ?? [];

  const columns: Column<UserRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department', render: (r) => r.department ?? '—' },
    { key: 'designation', label: 'Designation', render: (r) => r.designation ?? '—' },
    { key: 'joinDate', label: 'Joined', render: (r) => formatDate(r.joinDate) },
    {
      key: 'employmentStatus',
      label: 'Employment',
      render: (r) => <StatusChip value={r.employmentStatus} />,
    },
    { key: 'account', label: 'Account', render: (r) => <StatusChip value={userStatus(r)} /> },
  ];

  return (
    <Box>
      <PageHeader
        title="Employee Records"
        subtitle="Click an employee to view leave & attendance"
        actionLabel={canCreate ? 'New employee' : undefined}
        onAction={canCreate ? dialog.openCreate : undefined}
      />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(row) => navigate(`/hr/employees/${row.id}`)}
          emptyMessage={loading ? 'Loading…' : 'No employees yet.'}
        />
      </Box>
      <CrudDialog open={dialog.open} title="New employee" onClose={dialog.close}>
        <UserForm
          initial={null}
          onCancel={dialog.close}
          onDone={() => {
            void refetch();
            dialog.close();
          }}
        />
      </CrudDialog>
    </Box>
  );
}
