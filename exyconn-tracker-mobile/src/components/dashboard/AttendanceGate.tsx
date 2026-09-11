import type { Workday } from '@exyconn/tracker-core';
import { humanize } from '@exyconn/tracker-core';
import { AttendanceForm } from '../../forms/attendance';
import { Caption } from '../ui/Typography';

interface Props {
  workday: Workday | null;
}

/** "Marked in today as Working from home — dentist at 4." */
function markedLine(workday: Workday): string {
  const status = humanize(workday.attendanceStatus ?? 'PRESENT');
  const note = workday.attendanceNote ? ` — ${workday.attendanceNote}` : '';
  return `Marked in today as ${status}${note}.`;
}

/**
 * Marking in for the day — the gate tracking sits behind.
 *
 * Attendance first, then tracking, and not the other way round: a timesheet for a day nobody
 * said they worked is a question payroll cannot answer later. It is the same record as the
 * employee portal's own "Mark attendance", so somebody who marked in there this morning
 * arrives here already done. Nothing at all until the portal has told us what today is.
 */
export function AttendanceGate({ workday }: Readonly<Props>) {
  if (workday === null) {
    return null;
  }
  if (workday.attendanceMarked) {
    return <Caption>{markedLine(workday)}</Caption>;
  }
  return <AttendanceForm />;
}
