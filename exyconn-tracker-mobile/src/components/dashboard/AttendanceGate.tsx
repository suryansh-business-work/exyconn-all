import { useT } from '@exyconn/i18n';
import type { Workday } from '@exyconn/tracker-core';
import { humanize } from '@exyconn/tracker-core';
import { AttendanceForm } from '../../forms/attendance';
import { Caption } from '../ui/Typography';

interface Props {
  workday: Workday | null;
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
  const t = useT();
  if (workday === null) {
    return null;
  }
  if (workday.attendanceMarked) {
    // "Marked in today as Working from home — dentist at 4."
    const status = t(humanize(workday.attendanceStatus ?? 'PRESENT'));
    const note = workday.attendanceNote ?? '';
    const line =
      note === ''
        ? t('Marked in today as {status}.', { status })
        : t('Marked in today as {status} — {note}.', { status, note });
    return <Caption>{line}</Caption>;
  }
  return <AttendanceForm />;
}
