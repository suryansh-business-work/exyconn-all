import { useNavigate } from 'react-router-dom';
import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { ROLES } from '@exyconn/shell/auth/roles';
import { useListUsersQuery } from '@exyconn/shell/graphql/generated';
import { workHours } from '@exyconn/shell/components/work';
import type { UserRow } from '@exyconn/shell/pages/user-forms/user';
import { userStatus } from '@exyconn/shell/pages/UserDetails/user-details.types';

/** HR Employee Records — workforce directory; row click opens the detail screen. */
export function EmployeeRecordsPage() {
  const { data, loading } = useListUsersQuery({ fetchPolicy: 'cache-and-network' });
  const navigate = useNavigate();
  const { formatDate } = useSettings();
  const { user } = useAuth();
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
      key: 'workLocation',
      label: 'Works from',
      render: (r) => <StatusChip value={r.workLocation ?? 'OFFICE'} />,
    },
    {
      key: 'workHoursPerDay',
      // The number the desktop tracker measures each day against, so it belongs in the
      // directory rather than only inside the record.
      label: 'Hrs/day',
      render: (r) => `${workHours(r)} h`,
    },
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
        onAction={canCreate ? () => navigate('/hr/employees/new') : undefined}
      />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(row) => navigate(`/hr/employees/${row.id}`)}
          emptyMessage={loading ? 'Loading…' : 'No employees yet.'}
        />
      </Box>
    </Box>
  );
}
