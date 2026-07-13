import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { startOfMonth, addMonths, addDays, format, parse, isValid } from 'date-fns';
import { withParam } from '@/utils/searchParams';

/** Month navigation + selected-day state, with the ISO ranges the queries need. */
export interface TrackerMonthState {
  month: Date;
  monthLabel: string;
  prev: () => void;
  next: () => void;
  selectedDate: string | null;
  setSelectedDate: (date: string) => void;
  range: { from: string; to: string };
  dayRange: { start: string; end: string } | null;
}

/** Query-string keys owned by this hook — see also `employee` on TrackerPage. */
export const MONTH_PARAM = 'month';
export const DATE_PARAM = 'date';

const MONTH_FORMAT = 'yyyy-MM';
const DATE_FORMAT = 'yyyy-MM-dd';

/** `YYYY-MM` -> first day of that month; the current month when absent/invalid. */
function parseMonthParam(value: string | null): Date {
  if (!value) return startOfMonth(new Date());
  const parsed = parse(value, MONTH_FORMAT, new Date());
  if (!isValid(parsed)) return startOfMonth(new Date());
  return startOfMonth(parsed);
}

/** `YYYY-MM-DD` -> itself; `null` when absent or not a real calendar date. */
function parseDateParam(value: string | null): string | null {
  if (!value) return null;
  return isValid(parse(value, DATE_FORMAT, new Date())) ? value : null;
}

/**
 * Owns the tracker calendar's month + selected-day state — held in the URL query
 * string (`?month=YYYY-MM&date=YYYY-MM-DD`) so the view is shareable, bookmarkable
 * and survives a refresh — and derives the ISO ranges the queries need: month
 * `from` (first day 00:00) / `to` (next month 00:00 = last day 24:00), and the
 * selected day's `start` (00:00) / `end` (+24h).
 *
 * Writes REPLACE the history entry: browsing months must not spam the back button.
 */
export function useTrackerMonth(): TrackerMonthState {
  const [searchParams, setSearchParams] = useSearchParams();
  const monthParam = searchParams.get(MONTH_PARAM);
  const dateParam = searchParams.get(DATE_PARAM);

  const month = useMemo(() => parseMonthParam(monthParam), [monthParam]);
  const selectedDate = parseDateParam(dateParam);

  const shiftMonth = useCallback(
    (delta: number) => {
      const value = format(addMonths(month, delta), MONTH_FORMAT);
      setSearchParams((current) => withParam(current, MONTH_PARAM, value), { replace: true });
    },
    [month, setSearchParams],
  );

  const prev = useCallback(() => shiftMonth(-1), [shiftMonth]);
  const next = useCallback(() => shiftMonth(1), [shiftMonth]);

  const setSelectedDate = useCallback(
    (date: string) => {
      setSearchParams((current) => withParam(current, DATE_PARAM, date), { replace: true });
    },
    [setSearchParams],
  );

  const range = useMemo(
    () => ({
      from: startOfMonth(month).toISOString(),
      to: startOfMonth(addMonths(month, 1)).toISOString(),
    }),
    [month],
  );

  const dayRange = useMemo(() => {
    if (!selectedDate) return null;
    const start = new Date(`${selectedDate}T00:00:00`);
    return { start: start.toISOString(), end: addDays(start, 1).toISOString() };
  }, [selectedDate]);

  return {
    month,
    monthLabel: format(month, 'MMMM yyyy'),
    prev,
    next,
    selectedDate,
    setSelectedDate,
    range,
    dayRange,
  };
}
