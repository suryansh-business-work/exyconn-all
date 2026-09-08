import type { TrackerStatus } from '@shared/types';

/** What the schedule wants done right now. */
export type AutoAction = 'start' | 'stop' | 'none';

/** Everything the decision depends on. No clocks or state read inside — see `decideAutoAction`. */
export interface AutoStartInput {
  enabled: boolean;
  /** Local hours, 0-23. A stop at or before the start means the window crosses midnight. */
  startHour: number;
  stopHour: number;
  /** The hour it is now, on the employee's own clock. */
  hour: number;
  status: TrackerStatus;
  /** Tracking cannot start before the employee has marked themselves in. */
  attendanceMarked: boolean;
  /**
   * The employee stopped or paused it themselves inside this window.
   *
   * Without this the app would restart tracking within the minute and there would be no way
   * to stop working before the end of the window — the schedule would be a trap rather than
   * a convenience.
   */
  overridden: boolean;
}

/**
 * Whether the hour falls inside the scheduled window.
 *
 * A stop hour at or before the start hour describes a window that runs past midnight (a
 * night shift), so the test flips from "between" to "outside the gap" — 22→6 must include
 * 23 and 02, and exclude 12.
 */
export function isWithinWindow(startHour: number, stopHour: number, hour: number): boolean {
  if (startHour < stopHour) {
    return hour >= startHour && hour < stopHour;
  }
  return hour >= startHour || hour < stopHour;
}

/**
 * The hour it is now on a clock in `timeZone`.
 *
 * The window is set in the EMPLOYEE's zone, not this machine's: a workspace that says
 * "start at 9" means nine where the person works, and a laptop still set to another
 * country would otherwise start their day at the wrong time.
 */
export function hourIn(timeZone: string, now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);
  return Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
}

/**
 * The one place the scheduled-tracking decision is made.
 *
 * Kept pure so every edge — a night shift, an employee who stopped early, an unmarked
 * attendance, a consent screen still open — is a table test rather than something only
 * reproducible by waiting until 9am.
 */
export function decideAutoAction(input: AutoStartInput): AutoAction {
  if (!input.enabled) {
    return 'none';
  }
  const inWindow = isWithinWindow(input.startHour, input.stopHour, input.hour);

  if (!inWindow) {
    // Outside the window the schedule only ever stops something it could have started.
    return input.status === 'tracking' ? 'stop' : 'none';
  }
  // Inside it: start only from a standing start. `paused` is the employee's own choice and
  // `consent-required` has a screen in front of it that a schedule must not click through.
  if (input.status !== 'idle' || input.overridden || !input.attendanceMarked) {
    return 'none';
  }
  return 'start';
}
