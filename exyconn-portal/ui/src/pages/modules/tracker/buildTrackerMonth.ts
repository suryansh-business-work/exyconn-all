import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from 'date-fns';
import type { TrackerDayBucketData } from './tracker.types';

/** A single cell of the tracker month grid, with its day bucket resolved. */
export interface TrackerDayCell {
  date: Date;
  dateKey: string;
  inMonth: boolean;
  isToday: boolean;
  bucket?: TrackerDayBucketData;
}

/**
 * Build the full month grid — whole weeks, Sunday-first — overlaying each day's
 * activity bucket (keyed by its `YYYY-MM-DD` string). Pure — no React.
 */
export function buildTrackerMonth(
  month: Date,
  buckets: readonly TrackerDayBucketData[],
  today: Date,
): TrackerDayCell[] {
  const byDate = new Map(buckets.map((bucket) => [bucket.date, bucket]));
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return {
      date,
      dateKey,
      inMonth: isSameMonth(date, month),
      isToday: isSameDay(date, today),
      bucket: byDate.get(dateKey),
    };
  });
}
