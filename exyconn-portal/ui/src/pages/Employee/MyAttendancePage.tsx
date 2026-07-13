import { useState } from 'react';
import { Box } from '@/components/ui';
import { DataTable, type Column } from '@/components/data/DataTable';
import { StatusChip } from '@/components/data/StatusChip';
import { CrudDialog } from '@/components/data/CrudDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { glass } from '@/components/glass/glass';
import { useSettings } from '@/hooks/useSettings';
import { useMyAttendanceQuery } from '@/graphql/generated';
import { MarkAttendanceForm } from './forms/mark-attendance';

type AttendanceRow = { id: string; date: string; status: string; note?: string | null };

/** Employee self-service: mark and review your own attendance. */
export function MyAttendancePage() {
  const { data, loading, refetch } = useMyAttendanceQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();
  const [open, setOpen] = useState(false);

  const rows = (data?.myAttendance ?? []) as AttendanceRow[];

  const columns: Column<AttendanceRow>[] = [
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'note', label: 'Note', render: (r) => r.note ?? '—' },
  ];

  return (
    <Box>
      <PageHeader
        title="My Attendance"
        subtitle="Mark your attendance for the day"
        actionLabel="Mark attendance"
        onAction={() => setOpen(true)}
      />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={loading ? 'Loading…' : 'No attendance recorded yet.'}
        />
      </Box>
      <CrudDialog open={open} title="Mark attendance" onClose={() => setOpen(false)}>
        <MarkAttendanceForm
          onCancel={() => setOpen(false)}
          onDone={() => {
            void refetch();
            setOpen(false);
          }}
        />
      </CrudDialog>
    </Box>
  );
}
