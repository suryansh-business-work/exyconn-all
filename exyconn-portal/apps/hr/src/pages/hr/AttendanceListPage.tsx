import { useMemo } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useListAttendanceQuery, useListUsersQuery } from '@exyconn/shell/graphql/generated';

type AttendanceRow = {
  id: string;
  employeeId: string;
  date: string;
  status: string;
  note?: string | null;
};

/** HR Attendance — every recorded attendance entry across the workforce. */
export function AttendanceListPage() {
  const { data, loading } = useListAttendanceQuery({ fetchPolicy: 'cache-and-network' });
  const { data: usersData } = useListUsersQuery();
  const { formatDate } = useSettings();

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    (usersData?.listUsers ?? []).forEach((u) => map.set(u.id, u.name));
    return map;
  }, [usersData]);

  const rows = (data?.listAttendance ?? []) as AttendanceRow[];

  const columns: Column<AttendanceRow>[] = [
    {
      key: 'employeeId',
      label: 'Employee',
      render: (r) => nameById.get(r.employeeId) ?? r.employeeId,
    },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'note', label: 'Note', render: (r) => r.note ?? '—' },
  ];

  return (
    <Box>
      <PageHeader title="Attendance" subtitle="All recorded attendance entries" />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={loading ? 'Loading…' : 'No attendance recorded yet.'}
        />
      </Box>
    </Box>
  );
}
