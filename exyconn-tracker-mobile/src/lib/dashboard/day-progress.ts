import { DEFAULT_WORK_HOURS, formatHoursMinutes } from '@exyconn/tracker-core';
import type { WorkProfile, Workday } from '@exyconn/tracker-core';

/** What the day amounts to, worked out once and drawn either way (bar or ring). */
export interface DayFigures {
  percent: number;
  targetMs: number;
  remainingMs: number;
  done: boolean;
  hours: number;
}

/**
 * Today's figures. The target is the portal's workday, else HR's contracted day; active time
 * only — idle minutes are time at a desk, not time worked.
 */
export function dayFigures(
  workday: Workday | null,
  workProfile: WorkProfile | null,
  activeMs: number,
): DayFigures {
  const targetMs = workday?.targetMs ?? workProfile?.targetMs ?? 0;
  const remainingMs = Math.max(0, targetMs - activeMs);
  return {
    targetMs,
    remainingMs,
    percent: targetMs > 0 ? Math.min(100, Math.round((activeMs / targetMs) * 100)) : 0,
    done: remainingMs === 0 && targetMs > 0,
    hours: workProfile?.workHoursPerDay ?? DEFAULT_WORK_HOURS,
  };
}

/** The sentence under either shape: how far in, or that the day is done. */
export function daySummary(figures: DayFigures): string {
  if (figures.done) {
    return `Full ${figures.hours}h day complete.`;
  }
  return `${figures.percent}% — ${formatHoursMinutes(figures.remainingMs)} left of your ${figures.hours}h day.`;
}

/** Where the target came from — stated, so nobody thinks the tracker invented their day. */
export function dayTargetSource(figures: DayFigures): string {
  return `Your working day is ${figures.hours} hours, set by HR on your employee record. The default is ${DEFAULT_WORK_HOURS}. Only ACTIVE time counts — idle minutes do not fill this bar.`;
}

/** "3h 10m of 8h 0m worked today" — what a screen reader says for either shape. */
export function dayProgressLabel(figures: DayFigures, activeMs: number): string {
  return `${formatHoursMinutes(activeMs)} of ${formatHoursMinutes(figures.targetMs)} worked today`;
}
