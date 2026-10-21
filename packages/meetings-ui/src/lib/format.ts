import { formatDuration } from '@exyconn/shell/pages/tracker-view/tracker.format';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

/** A meeting length in seconds as hours and minutes, e.g. 5400 -> "1h 30m". */
export function formatSeconds(seconds: number): string {
  return formatDuration(seconds * MS_PER_SECOND);
}

const twoDigits = (value: number) => String(value).padStart(2, '0');

/**
 * How far into the call a transcript line was said, as a timestamp on a recording reads:
 * `4:05`, or `1:02:09` past the first hour. An offset, not a date, so no locale format applies.
 */
export function formatOffset(ms: number): string {
  const totalSeconds = Math.floor(ms / MS_PER_SECOND);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  if (hours === 0) {
    return `${minutes}:${twoDigits(seconds)}`;
  }
  return `${hours}:${twoDigits(minutes)}:${twoDigits(seconds)}`;
}

/** A confidence between 0 and 1 as a whole percentage, e.g. 0.874 -> 87. */
export function confidencePercent(confidence: number): number {
  return Math.round(confidence * 100);
}
