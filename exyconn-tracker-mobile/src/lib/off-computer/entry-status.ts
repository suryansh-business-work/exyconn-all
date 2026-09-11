import type { ManualEntry, ManualEntryStatus } from '@exyconn/tracker-core';
import type { IconName } from '../../components/ui/Icon';
import type { ThemeColor } from '../../theme/useThemeColor';

export interface StatusLook {
  label: string;
  tone: ThemeColor;
  /** Carries the decision without the colour, for anyone who cannot tell the hues apart. */
  icon: IconName;
}

/**
 * How each decision reads. Pending is deliberately neutral: it is not a promise, and a claim
 * in a hopeful colour would read as hours already on the timesheet.
 */
export const ENTRY_STATUS: Readonly<Record<ManualEntryStatus, StatusLook>> = {
  PENDING: { label: 'Waiting on a decision', tone: 'muted', icon: 'clock-outline' },
  APPROVED: { label: 'Approved', tone: 'success', icon: 'check-circle-outline' },
  REJECTED: { label: 'Rejected', tone: 'error', icon: 'close-circle-outline' },
};

/** What the time was booked against, in the words the picker used. */
export function bookedTo(
  entry: Pick<ManualEntry, 'projectName' | 'taskKey' | 'taskTitle'>,
): string {
  if (entry.taskKey === '') {
    return entry.projectName;
  }
  return `${entry.projectName} · ${entry.taskKey} ${entry.taskTitle}`;
}
