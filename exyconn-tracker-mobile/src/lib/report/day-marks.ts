import type { DayMark } from '@exyconn/tracker-core';

/** Each mark in the words both apps use — the legend and the day's spoken name. */
export const MARK_WORDS: Readonly<Record<DayMark, string>> = {
  SHORT: 'Short',
  LEAVE: 'Leave',
  HOLIDAY: 'Holiday',
  WEEK_OFF: 'Week off',
};

/** The legend's order: what needs attention first, then the days that were never owed. */
export const MARK_ORDER: readonly DayMark[] = ['SHORT', 'LEAVE', 'HOLIDAY', 'WEEK_OFF'];
