import { formatClock, formatSignedClock } from './format';
import type { Translate } from './translate';
import type { WorkProfile, Workday } from './types';
import { DEFAULT_WORK_HOURS } from './work-day';

/**
 * Today's progress towards the contracted day, worked out the same on the desktop and the
 * phone. Active time only: idle minutes are time at a desk, not time worked, and a bar that
 * counted them would fill on its own while nobody was there.
 */
export interface DayFigures {
  percent: number;
  targetMs: number;
  /** Time left of the day; it keeps running below zero once the day is done. */
  remainingMs: number;
  done: boolean;
  hours: number;
}

/** Today's figures. The target is the portal's workday, else HR's contracted day. */
export function dayFigures(
  workday: Workday | null,
  workProfile: WorkProfile | null,
  activeMs: number,
): DayFigures {
  const targetMs = workday?.targetMs ?? workProfile?.targetMs ?? 0;
  const remainingMs = targetMs - activeMs;
  return {
    targetMs,
    remainingMs,
    percent: targetMs > 0 ? Math.min(100, Math.round((activeMs / targetMs) * 100)) : 0,
    done: targetMs > 0 && remainingMs <= 0,
    hours: workProfile?.workHoursPerDay ?? DEFAULT_WORK_HOURS,
  };
}

/**
 * The sentence under either shape: how far in, or that the day is done with the time left
 * still running below zero ("-00:12:34 left").
 */
export function daySummary(figures: DayFigures, t: Translate): string {
  if (figures.done) {
    return t('Full {hours}h day complete — {remaining} left.', {
      hours: figures.hours,
      remaining: formatSignedClock(figures.remainingMs),
    });
  }
  return t('{percent}% — {remaining} left of your {hours}h day.', {
    percent: figures.percent,
    remaining: formatClock(figures.remainingMs),
    hours: figures.hours,
  });
}

/** Where the target came from — stated, so nobody thinks the tracker invented their day. */
export function dayTargetSource(figures: DayFigures, t: Translate): string {
  return t(
    'Your working day is {hours} hours, set by HR on your employee record. The default is {fallback}. Only ACTIVE time counts — idle minutes do not fill this bar.',
    { hours: figures.hours, fallback: DEFAULT_WORK_HOURS },
  );
}

/** "03:10:00 of 08:00:00 worked today" — what a screen reader says for either shape. */
export function dayProgressLabel(figures: DayFigures, activeMs: number, t: Translate): string {
  return t('{active} of {target} worked today', {
    active: formatClock(activeMs),
    target: formatClock(figures.targetMs),
  });
}
