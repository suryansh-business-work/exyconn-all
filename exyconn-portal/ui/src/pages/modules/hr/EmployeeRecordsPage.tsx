import { useNavigate } from 'react-router-dom';
import { Box } from '@/components/ui';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { PageHeader } from '../../../components/layout/PageHeader';
import { glass } from '../../../components/glass/glass';
import { useSettings } from '../../../hooks/useSettings';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useAuth } from '../../../auth/AuthContext';
import { ROLES } from '../../../auth/roles';
import { useListUsersQuery } from '../../../graphql/generated';
import { UserForm, type UserRow } from '../admin/forms/user';
import { userStatus } from '../admin/UserDetails/user-details.types';

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
          onRowClick={(row) => navigate(`/portal/hr/employees/${row.id}`)}
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
