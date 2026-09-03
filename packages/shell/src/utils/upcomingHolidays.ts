import { isAfter } from 'date-fns';
import { toDate } from './date';

export interface HolidayLike {
  id: string;
  name: string;
  date: string;
}

/** The next holidays after `today`, soonest first. Unparseable dates are skipped. */
export function upcomingHolidays<T extends HolidayLike>(
  holidays: T[],
  today: Date,
  limit = 3,
): T[] {
  return (
    holidays
      .filter((h) => {
        const date = toDate(h.date);
        return date ? isAfter(date, today) : false;
      })
      // filter() returned a fresh array, so sorting it cannot touch the caller's.
      .sort((a, b) => (toDate(a.date)?.getTime() ?? 0) - (toDate(b.date)?.getTime() ?? 0))
      .slice(0, limit)
  );
}
