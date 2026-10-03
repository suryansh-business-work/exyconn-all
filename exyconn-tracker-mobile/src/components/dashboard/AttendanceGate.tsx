import { Spinner, XStack } from 'tamagui';
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
 * arrives here already done. A loader until the portal has told us what today is.
 */
export function AttendanceGate({ workday }: Readonly<Props>) {
  const t = useT();
  // Null until the portal has said what today is — a loader, not a gap that later jumps in.
  if (workday === null) {
    return (
      <XStack
        gap="$2"
        alignItems="center"
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('Checking today’s attendance…')}
      >
        <Spinner size="small" />
        <Caption>{t('Checking today’s attendance…')}</Caption>
      </XStack>
    );
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
