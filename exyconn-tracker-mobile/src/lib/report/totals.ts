import {
  activityPercent,
  formatCount,
  formatDayLabel,
  formatHoursMinutes,
  type DayDetail,
  type ReportDay,
} from '@exyconn/tracker-core';

/** A span's headline numbers — the month's, or one day's. */
export interface ReportTotals {
  activeMs: number;
  idleMs: number;
  activityPercent: number;
}

export interface Summary {
  id: string;
  label: string;
  value: string;
}

/** The month added up, with its activity read from the sums (never an average of averages). */
export function sumReport(days: readonly ReportDay[]): ReportTotals {
  let activeMs = 0;
  let idleMs = 0;
  for (const day of days) {
    activeMs += day.activeMs;
    idleMs += day.idleMs;
  }
  return { activeMs, idleMs, activityPercent: activityPercent(activeMs, idleMs) };
}

/** One day's totals, in the same shape as the month's so one panel draws both. */
export function dayTotals(detail: DayDetail): ReportTotals {
  return {
    activeMs: detail.activeMs,
    idleMs: detail.idleMs,
    activityPercent: activityPercent(detail.activeMs, detail.idleMs),
  };
}

export function summaries(totals: ReportTotals): Summary[] {
  return [
    { id: 'worked', label: 'Total worked', value: formatHoursMinutes(totals.activeMs) },
    { id: 'idle', label: 'Total idle', value: formatHoursMinutes(totals.idleMs) },
    { id: 'activity', label: 'Avg activity', value: `${totals.activityPercent}%` },
  ];
}

/**
 * Counts only — the tracker records how much you typed, never what you typed. These are the
 * portal's numbers for the employee across every device, so a laptop's keys show here too.
 */
export function inputSummary(detail: DayDetail): string {
  const keys = formatCount(detail.keyCount);
  const clicks = formatCount(detail.mouseCount);
  const sessions = formatCount(detail.sessions);
  return `${keys} keys · ${clicks} clicks · ${sessions} sessions`;
}

/** A table row read aloud as one sentence, so a screen reader does not walk seven cells. */
export function dayRowLabel(day: ReportDay): string {
  const percent = activityPercent(day.activeMs, day.idleMs);
  return [
    formatDayLabel(day.date),
    `worked ${formatHoursMinutes(day.activeMs)}`,
    `idle ${formatHoursMinutes(day.idleMs)}`,
    `${percent}% active`,
    `${formatCount(day.keyCount)} keys`,
    `${formatCount(day.mouseCount)} clicks`,
    `${formatCount(day.sessions)} sessions`,
  ].join(', ');
}
