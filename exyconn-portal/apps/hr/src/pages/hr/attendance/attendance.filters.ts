import { formatISO } from 'date-fns';
import { FilterOp, type TableFilterInput } from '@exyconn/shell/graphql/generated';

/** What the toolbar above the attendance register narrows it by. Empty means "any". */
export interface AttendanceFilterState {
  status: string;
  employeeId: string;
  projectId: string;
  from: Date | null;
  to: Date | null;
}

export const EMPTY_ATTENDANCE_FILTERS: AttendanceFilterState = {
  status: '',
  employeeId: '',
  projectId: '',
  from: null,
  to: null,
};

/** A picked day as the `YYYY-MM-DD` the server keys attendance on — the day the viewer chose. */
const dayOf = (date: Date | null) =>
  date && !Number.isNaN(date.getTime()) ? formatISO(date, { representation: 'date' }) : '';

/**
 * The server filters one toolbar state adds to every page request. Field names match
 * `listAttendancePaged`: status/employeeId are plain matches, the rest the server reads itself.
 */
export function attendanceFilters(state: AttendanceFilterState): TableFilterInput[] {
  const values: Array<[string, string]> = [
    ['status', state.status],
    ['employeeId', state.employeeId],
    ['projectId', state.projectId],
    ['dateFrom', dayOf(state.from)],
    ['dateTo', dayOf(state.to)],
  ];
  return values
    .filter(([, value]) => value !== '')
    .map(([field, value]) => ({ field, op: FilterOp.Equals, value }));
}

/** True when any filter is set, so the toolbar can offer to clear them. */
export const hasAttendanceFilters = (state: AttendanceFilterState): boolean =>
  attendanceFilters(state).length > 0;
