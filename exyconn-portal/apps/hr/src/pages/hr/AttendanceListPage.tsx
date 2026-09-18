import { useState } from 'react';
import { CrudDashboard, usePagedFetcher } from '@exyconn/crud';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListAttendancePagedDocument,
  type ListAttendancePagedQuery,
} from '@exyconn/shell/graphql/generated';
import {
  ATTENDANCE_COLUMNS,
  type AttendanceEntryRow,
  type AttendanceGridContext,
} from './attendance/attendance-grid';
import {
  EMPTY_ATTENDANCE_FILTERS,
  attendanceFilters,
  type AttendanceFilterState,
} from './attendance/attendance.filters';
import { AttendanceFilters } from './attendance/AttendanceFilters';
import { AttendanceDetailDialog } from './attendance/AttendanceDetailDialog';

/**
 * HR Attendance — every attendance record across the workforce, server-paged, with each
 * day's tracker brief: time worked, sessions and the projects it went on.
 */
export function AttendanceListPage() {
  const { formatDate } = useSettings();
  const [filters, setFilters] = useState<AttendanceFilterState>(EMPTY_ATTENDANCE_FILTERS);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [viewing, setViewing] = useState<AttendanceEntryRow | null>(null);

  const fetchRows = usePagedFetcher(
    ListAttendancePagedDocument,
    (data: ListAttendancePagedQuery) => data.listAttendancePaged,
    attendanceFilters(filters),
  );

  const changeFilters = (next: AttendanceFilterState) => {
    setFilters(next);
    setRefreshSignal((signal) => signal + 1);
  };

  const gridContext: AttendanceGridContext = {
    actions: { details: setViewing },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Attendance"
      subtitle="Every attendance record, with what the tracker recorded that day"
      entityLabel="attendance record"
      stats={[]}
      refreshSignal={refreshSignal}
      columnDefs={ATTENDANCE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by employee, email or note…"
      exportFileName="attendance"
      onRowClick={setViewing}
      toolbar={<AttendanceFilters value={filters} onChange={changeFilters} />}
      extraDialogs={<AttendanceDetailDialog entry={viewing} onClose={() => setViewing(null)} />}
    />
  );
}
