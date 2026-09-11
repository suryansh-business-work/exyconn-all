import {
  activityLevel,
  activityPercent,
  formatDayLabel,
  type ActivityLevel,
  type ReportDay,
} from '@exyconn/tracker-core';

/**
 * The month grid behind the report's calendar — the phone's stand-in for MUI's DateCalendar.
 * Weeks run Sunday to Saturday, as the desktop's picker lays them out.
 */

export interface CalendarCell {
  /** `yyyy-MM-dd` — unique in the grid, so it is also the React key. */
  key: string;
  date: Date;
  /** 1–31. */
  dayOfMonth: number;
  /** Days of the neighbouring months pad the first and last week; they are drawn blank. */
  inMonth: boolean;
  /** The employee tracked time on this day — it gets a dot. */
  tracked: boolean;
  /** How active that day was — the dot's colour. Null on a day with nothing tracked. */
  level: ActivityLevel | null;
  selected: boolean;
  /** Today is ringed, as the desktop's picker rings it. */
  today: boolean;
  /** After today: the employee cannot look into the future. */
  disabled: boolean;
}

export interface CalendarWeek {
  key: string;
  cells: CalendarCell[];
}

export interface GridOptions {
  /** `yyyy-MM-dd` → how active that day was, for every day with tracked time. */
  tracked: ReadonlyMap<string, ActivityLevel>;
  selected: Date;
  /** Today — nothing after it can be picked. */
  maxDate: Date;
}

const DAYS_IN_WEEK = 7;

/** Local calendar key, matching the portal's timezone-bucketed `ReportDay.date`. */
export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The days that have tracked time, keyed `yyyy-MM-dd`, with how active each was. */
export function trackedDateLevels(days: readonly ReportDay[]): Map<string, ActivityLevel> {
  return new Map(
    days
      .filter((day) => day.activeMs + day.idleMs > 0)
      .map((day) => [
        day.date.slice(0, 10),
        activityLevel(activityPercent(day.activeMs, day.idleMs)),
      ]),
  );
}

function cellOf(date: Date, month: number, options: GridOptions): CalendarCell {
  const key = dateKey(date);
  const inMonth = date.getMonth() === month;
  const todayKey = dateKey(options.maxDate);
  const level = inMonth ? (options.tracked.get(key) ?? null) : null;
  return {
    key,
    date,
    dayOfMonth: date.getDate(),
    inMonth,
    tracked: level !== null,
    level,
    selected: key === dateKey(options.selected),
    today: key === todayKey,
    // `yyyy-MM-dd` keys sort as the dates they name.
    disabled: key > todayKey,
  };
}

/** Every week that touches `month`, each padded to seven days with its neighbours' dates. */
export function buildMonthGrid(month: Date, options: GridOptions): CalendarWeek[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leading = first.getDay();
  const weekCount = Math.ceil((leading + daysInMonth) / DAYS_IN_WEEK);

  return Array.from({ length: weekCount }, (_unused, week) => {
    const cells = Array.from({ length: DAYS_IN_WEEK }, (_blank, weekday) =>
      cellOf(
        new Date(year, monthIndex, 1 - leading + week * DAYS_IN_WEEK + weekday),
        monthIndex,
        options,
      ),
    );
    return { key: cells[0].key, cells };
  });
}

/** "Sun" … "Sat", read off a week's own dates through the app's one day formatter. */
export function weekdayLabels(week: CalendarWeek): { key: string; label: string }[] {
  return week.cells.map((cell) => ({
    key: cell.key,
    label: formatDayLabel(cell.date).split(' ')[0],
  }));
}
