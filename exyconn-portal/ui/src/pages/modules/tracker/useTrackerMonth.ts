import { useCallback, useMemo, useState } from 'react';
import { startOfMonth, addMonths, subMonths, addDays, format } from 'date-fns';

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

/**
 * Owns the tracker calendar's month + selected-day state and derives the ISO
 * ranges: month `from` (first day 00:00) / `to` (next month 00:00 = last day
 * 24:00), and the selected day's `start` (00:00) / `end` (+24h).
 */
export function useTrackerMonth(): TrackerMonthState {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const prev = useCallback(() => setMonth((current) => subMonths(current, 1)), []);
  const next = useCallback(() => setMonth((current) => addMonths(current, 1)), []);

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
