import { formatInTimeZone } from 'date-fns-tz';
import type { TrackerSettings, TrackerStatus } from '@shared/types';
import { formatHourLabel, isWithinWindow } from '@shared/schedule';

/**
 * How close to the end of the window counts as "about to stop".
 *
 * Long enough to finish what is on screen and claim the rest as off-computer time; short
 * enough that it is a warning rather than a banner nobody reads by three in the afternoon.
 */
const WARN_MINUTES = 15;

/** What the employee is told about the workspace's tracking window right now. */
export interface AutoStopNotice {
  severity: 'info' | 'warning';
  title: string;
  detail: string;
}

/** Minutes from now until the next time the clock reaches `hour:00`, in the employee's zone. */
function minutesUntilHour(hour: number, timezone: string, now: Date): number {
  const nowHour = Number(formatInTimeZone(now, timezone, 'H'));
  const nowMinute = Number(formatInTimeZone(now, timezone, 'm'));
  const minutesFromMidnight = nowHour * 60 + nowMinute;
  const target = hour * 60;
  const delta = target - minutesFromMidnight;
  // The stop hour has already passed today, so the next one is tomorrow's.
  return delta > 0 ? delta : delta + 24 * 60;
}

/** "1h 20m", or "8 minutes" once it is close enough to count in minutes. */
function untilLabel(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
}

/**
 * What to say about the workspace's tracking schedule, if anything.
 *
 * A window that stops tracking is a window that stops PAYING attention: work done after it
 * is not logged, and an employee who does not know the hour finds out from a timesheet that
 * ends at six. So the stop time is stated whenever a schedule exists, and turns into a
 * warning as it approaches — and outside the window it says the thing that is least obvious
 * of all, which is that a session started by hand will be stopped again within the minute.
 *
 * Null when the workspace runs no schedule: there is nothing to warn about, and a permanent
 * "you are in control" banner is noise.
 */
export function autoStopNotice(
  settings: TrackerSettings | null,
  timezone: string,
  status: TrackerStatus,
  now: Date = new Date(),
): AutoStopNotice | null {
  if (settings === null || !settings.autoStartEnabled) {
    return null;
  }

  const startLabel = formatHourLabel(settings.autoStartHour);
  const stopLabel = formatHourLabel(settings.autoStopHour);
  const hour = Number(formatInTimeZone(now, timezone, 'H'));

  if (!isWithinWindow(settings.autoStartHour, settings.autoStopHour, hour)) {
    return {
      severity: 'warning',
      title: `Outside your tracking hours (${startLabel} to ${stopLabel})`,
      detail:
        'Tracking stops itself within a minute of being started now, so time worked outside these hours has to be claimed as off-computer time.',
    };
  }

  const minutesLeft = minutesUntilHour(settings.autoStopHour, timezone, now);
  const running = status === 'tracking' || status === 'paused';

  if (running && minutesLeft <= WARN_MINUTES) {
    return {
      severity: 'warning',
      title: `Tracking stops in ${untilLabel(minutesLeft)}`,
      detail: `Your workspace ends tracking at ${stopLabel}. Anything you work on after that is not logged — claim it as off-computer time instead.`,
    };
  }

  return {
    severity: 'info',
    title: `Tracking hours: ${startLabel} to ${stopLabel}`,
    detail: `Tracking stops on its own at ${stopLabel} — ${untilLabel(minutesLeft)} from now. Time after that is not logged.`,
  };
}
