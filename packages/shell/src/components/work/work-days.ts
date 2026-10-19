import { useCallback } from 'react';
import { useFormatters, useI18n } from '@exyconn/i18n';

/**
 * Days of the week as the server stores them — 0 is Sunday, 6 is Saturday — listed in the
 * order a working week is read: Monday first.
 */
export const WEEK_DAYS: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

/** How long a weekday's name is: "Monday" or "Mon". */
export type WeekdayWidth = 'long' | 'short';

const DAY_MS = 86_400_000;
/** 1 January 2023 was a Sunday: adding `day` days lands on that weekday. */
const A_SUNDAY = Date.UTC(2023, 0, 1);

/** A weekday's name in `locale`, read in UTC so no zone can move it to the day before. */
export function weekdayName(day: number, locale: string, width: WeekdayWidth = 'short'): string {
  return new Intl.DateTimeFormat(locale, { weekday: width, timeZone: 'UTC' }).format(
    new Date(A_SUNDAY + day * DAY_MS),
  );
}

/** Weekday names in the person's own language. */
export function useWeekdayName(width: WeekdayWidth = 'short'): (day: number) => string {
  const { locale } = useI18n().settings;
  return useCallback((day: number) => weekdayName(day, locale, width), [locale, width]);
}

/** The given days, Monday first, each once. */
export function inWeekOrder(days: readonly number[]): number[] {
  const chosen = new Set(days);
  return WEEK_DAYS.filter((day) => chosen.has(day));
}

/** A week as one phrase in the person's language, e.g. "Mon, Tue, Wed, Thu, and Fri". */
export function useWeekLabel(): (days: readonly number[]) => string {
  const dayName = useWeekdayName();
  const { formatList } = useFormatters();
  return useCallback(
    (days: readonly number[]) => formatList(inWeekOrder(days).map(dayName)),
    [dayName, formatList],
  );
}
