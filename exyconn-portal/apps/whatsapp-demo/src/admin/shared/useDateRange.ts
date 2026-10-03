import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  differenceInCalendarDays,
  endOfDay,
  format,
  isValid,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';

/** The quick ranges offered beside the pickers, in days ending today. */
export const RANGE_PRESETS = [7, 30, 90] as const;
const DEFAULT_DAYS = 30;
/** How a day is written in the URL — a machine format, never shown to anyone. */
const URL_DAY = 'yyyy-MM-dd';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateRangeState {
  range: DateRange;
  /** ISO bounds for the server: the start of `from` and the end of `to`, local time. */
  variables: { from: string; to: string };
  /** The preset the range matches, or null when it was picked by hand. */
  preset: number | null;
  setRange: (next: DateRange) => void;
}

function parseDay(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const day = parseISO(value);
  return isValid(day) ? day : null;
}

/** The range ending today that is `days` long, both ends included. */
export function presetRange(days: number): DateRange {
  const to = startOfDay(new Date());
  return { from: subDays(to, days - 1), to };
}

function matchingPreset(range: DateRange): number | null {
  if (differenceInCalendarDays(new Date(), range.to) !== 0) {
    return null;
  }
  const length = differenceInCalendarDays(range.to, range.from) + 1;
  return RANGE_PRESETS.find((days) => days === length) ?? null;
}

/**
 * The analysed period, kept in the URL (`?from=…&to=…`) so it survives a reload, travels with
 * a shared link and stays put when switching between the Analytics and Sessions tabs (the
 * tab strip keeps the query string). Defaults to the last 30 days.
 */
export function useDateRange(): DateRangeState {
  const [params, setParams] = useSearchParams();
  const fallback = presetRange(DEFAULT_DAYS);
  const range: DateRange = {
    from: parseDay(params.get('from')) ?? fallback.from,
    to: parseDay(params.get('to')) ?? fallback.to,
  };

  const setRange = useCallback(
    (next: DateRange) => {
      setParams(
        (previous) => {
          const updated = new URLSearchParams(previous);
          updated.set('from', format(next.from, URL_DAY));
          updated.set('to', format(next.to, URL_DAY));
          return updated;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return {
    range,
    variables: {
      from: startOfDay(range.from).toISOString(),
      to: endOfDay(range.to).toISOString(),
    },
    preset: matchingPreset(range),
    setRange,
  };
}
