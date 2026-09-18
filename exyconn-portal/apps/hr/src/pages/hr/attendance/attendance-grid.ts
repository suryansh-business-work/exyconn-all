import type { ColDef } from 'ag-grid-community';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  actionsColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { GridTranslate } from '@exyconn/shell/components/data/gridContext';
import { formatDuration } from '@exyconn/shell/pages/tracker-view/tracker.format';
import type { ListAttendancePagedQuery } from '@exyconn/shell/graphql/generated';

export type AttendanceEntryRow = ListAttendancePagedQuery['listAttendancePaged']['rows'][number];
type ProjectTime = AttendanceEntryRow['tracker']['projects'][number];

/** Row handlers and the date formatter ag-grid hands to the shared cells. */
export type AttendanceGridContext = DatedCrudGridContext<AttendanceEntryRow>;

const DETAILS_ACTION: RowActionSpec = {
  key: 'details',
  label: 'view details',
  icon: InfoOutlinedIcon,
};

/** Time booked without picking a project still has to read as something. */
export const projectLabel = (project: ProjectTime, t: GridTranslate): string =>
  project.projectName || t('No project');

/** A duration, or a dash for a day nothing was recorded — "0m" reads like a measurement. */
export const durationOrDash = (ms: number): string => (ms > 0 ? formatDuration(ms) : '—');

/** Column model for the HR attendance register. */
export const ATTENDANCE_COLUMNS: ColDef<AttendanceEntryRow>[] = [
  derivedColumn('employeeName', 'Employee', (row) => row.employeeName),
  dateColumn('date', 'Date'),
  statusColumn('status', 'Status'),
  derivedColumn('activeMs', 'Active time', (row) => durationOrDash(row.tracker.activeMs)),
  derivedColumn('manualMs', 'Off-computer', (row) => durationOrDash(row.tracker.manualMs)),
  derivedColumn('sessions', 'Sessions', (row) => String(row.tracker.sessions)),
  derivedColumn(
    'projects',
    'Projects',
    (row, t) => row.tracker.projects.map((project) => projectLabel(project, t)).join(', ') || '—',
  ),
  valueColumn('note', 'Note', (row) => row.note ?? '—'),
  actionsColumn([DETAILS_ACTION]),
];
