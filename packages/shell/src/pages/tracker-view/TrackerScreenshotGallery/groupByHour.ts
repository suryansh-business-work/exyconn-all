import { formatInTimeZone } from 'date-fns-tz';

/** The least a screenshot must be for this module to place it on a clock. */
export interface CapturedShot {
  id: string;
  capturedAt: string;
}

/** One hour of a day, and the shots taken inside it. */
export interface ScreenshotHour<T> {
  /** The zone-local calendar hour, e.g. `2026-02-03 10` — stable, so it is the React key. */
  key: string;
  /**
   * The instant that hour began. Deliberately an instant and not a label: the caller formats
   * it with the workspace's own time pattern, so this module never invents a date format.
   */
  startsAt: string;
  /** Where this hour's first shot sits in `ordered` — what the viewer's paging counts on. */
  firstIndex: number;
  shots: T[];
}

/** A day's screenshots, hour by hour. */
export interface GroupedScreenshots<T> {
  /** Every shot in capture order. The full-screen viewer pages through THIS, across hours. */
  ordered: T[];
  hours: Array<ScreenshotHour<T>>;
}

/**
 * The instant the hour containing `at` began, on a clock in `timezone`.
 *
 * Every zone offset is a whole number of minutes, so subtracting the minutes and seconds the
 * zone itself reads lands exactly on that zone's hour boundary — no zone reconstruction, and
 * correct on the half-hour offsets (Kolkata, Kathmandu) where naive UTC truncation is not.
 */
function hourStart(at: Date, timezone: string): Date {
  const minutes = Number(formatInTimeZone(at, timezone, 'm'));
  const seconds = Number(formatInTimeZone(at, timezone, 's'));
  return new Date(at.getTime() - (minutes * 60 + seconds) * 1000 - at.getMilliseconds());
}

/**
 * Buckets a day's screenshots into the hours they were taken in, read in the timezone the
 * portal is being viewed in.
 *
 * A day of captures is a wall of near-identical thumbnails, and the question asked of it is
 * almost always "what was happening at four?" — so the hour is the unit it is read in. Shots
 * whose timestamp will not parse are dropped rather than bucketed under a broken heading:
 * they cannot be placed on a clock, and guessing an hour for them would be worse than
 * omitting them.
 */
export function groupScreenshotsByHour<T extends CapturedShot>(
  shots: readonly T[],
  timezone: string,
): GroupedScreenshots<T> {
  const ordered = [...shots]
    .filter((shot) => !Number.isNaN(new Date(shot.capturedAt).getTime()))
    .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());

  const hours: Array<ScreenshotHour<T>> = [];
  ordered.forEach((shot, index) => {
    const at = new Date(shot.capturedAt);
    const key = formatInTimeZone(at, timezone, 'yyyy-MM-dd HH');
    const current = hours[hours.length - 1];
    if (current?.key === key) {
      current.shots.push(shot);
      return;
    }
    hours.push({
      key,
      startsAt: hourStart(at, timezone).toISOString(),
      firstIndex: index,
      shots: [shot],
    });
  });

  return { ordered, hours };
}
