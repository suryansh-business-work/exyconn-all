import type { DayMark } from './expected-hours';

/** Each day status in the words every tracker surface uses — the tile, legend and spoken name. */
export const MARK_WORDS: Readonly<Record<DayMark, string>> = {
  COMPLETED: 'Completed',
  SHORT: 'Short',
  LEAVE: 'Leave',
  HOLIDAY: 'Holiday',
  WEEK_OFF: 'Week off',
  OFF_COMPUTER: 'Off Computer Work',
};

/** What each status means, for the legend's second line and a tile's tooltip. */
export const MARK_MEANINGS: Readonly<Record<DayMark, string>> = {
  COMPLETED: 'Working hours completed',
  SHORT: 'Less than the expected working hours',
  LEAVE: 'Approved leave (e.g. SL, EL)',
  HOLIDAY: 'Official holiday',
  WEEK_OFF: 'Scheduled weekly off',
  OFF_COMPUTER: 'Approved work done away from the computer',
};

/** The legend's order: done, then what needs attention, then the days never owed. */
export const MARK_ORDER: readonly DayMark[] = [
  'COMPLETED',
  'SHORT',
  'LEAVE',
  'HOLIDAY',
  'WEEK_OFF',
  'OFF_COMPUTER',
];
