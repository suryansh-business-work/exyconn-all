import { Box, Heading } from '@/components/ui';
import { DataTable, type Column } from '@/components/data/DataTable';
import { StatusChip } from '@/components/data/StatusChip';
import { glass } from '@/components/glass/glass';
import { useSettings } from '@/hooks/useSettings';
import { useAttendanceByEmployeeQuery } from '@/graphql/generated';

type AttendanceRow = { id: string; date: string; status: string; note?: string | null };

/** HR/ADMIN panel: an employee's recorded attendance entries (read-only). */
export function EmployeeAttendancePanel({ employeeId }: { employeeId: string }) {
  const { data, loading } = useAttendanceByEmployeeQuery({
    variables: { employeeId },
    fetchPolicy: 'cache-and-network',
  });
  const { formatDate } = useSettings();

  const rows = (data?.attendanceByEmployee ?? []) as AttendanceRow[];

  const columns: Column<AttendanceRow>[] = [
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'note', label: 'Note', render: (r) => r.note ?? '—' },
  ];

  return (
    <Box sx={[glass, { p: { xs: 1.5, md: 2 } }]}>
      <Heading level={6} sx={{ mb: 1 }}>
        Attendance
      </Heading>
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage={loading ? 'Loading…' : 'No attendance recorded.'}
      />
    </Box>
  );
}
