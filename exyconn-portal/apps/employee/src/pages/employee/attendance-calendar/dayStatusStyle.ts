import type { DayStatus } from './attendanceDays';

/** How a status is painted and explained. `tone` is a theme palette path. */
export interface DayStatusStyle {
  label: string;
  explanation: string;
  tone: string;
}

/**
 * The legend, in the order a day's colour is decided: the first that applies wins. Every
 * status also carries a word on the day itself, so the colour is never the only signal.
 */
export const DAY_STATUS_STYLE: Readonly<Record<Exclude<DayStatus, 'NONE'>, DayStatusStyle>> = {
  PRESENT: {
    label: 'Attendance marked',
    explanation: 'You marked yourself present, working from home or on a half day.',
    tone: 'success.main',
  },
  ABSENT: {
    label: 'Absent',
    explanation: 'Your attendance for the day was recorded as absent.',
    tone: 'text.disabled',
  },
  LEAVE_APPROVED: {
    label: 'Leave approved',
    explanation: 'Leave HR or your manager approved.',
    tone: 'secondary.main',
  },
  LEAVE_PENDING: {
    label: 'Leave requested',
    explanation: 'You asked for leave and it is waiting for a decision.',
    tone: 'warning.main',
  },
  LEAVE_REJECTED: {
    label: 'Leave rejected',
    explanation: 'Your leave request was turned down — mark attendance if you worked.',
    tone: 'error.main',
  },
  HOLIDAY: {
    label: 'Public holiday',
    explanation: 'A holiday observed where you work. Nothing to mark.',
    tone: 'info.main',
  },
};

export const LEGEND_ORDER = Object.keys(DAY_STATUS_STYLE) as Array<keyof typeof DAY_STATUS_STYLE>;
