import { useState } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useMyAttendanceQuery } from '@exyconn/shell/graphql/generated';
import { MyWorkArrangementCard } from '@exyconn/shell/components/work';
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

  if (open) {
    return (
      <CrudFormPage
        title="Mark attendance"
        onBack={() => setOpen(false)}
        backLabel="Back to My Attendance"
      >
        <MarkAttendanceForm
          onCancel={() => setOpen(false)}
          onDone={() => {
            void refetch();
            setOpen(false);
          }}
        />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="My Attendance"
        subtitle="Mark your attendance for the day"
        actionLabel="Mark attendance"
        onAction={() => setOpen(true)}
      />
      <MyWorkArrangementCard />
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
