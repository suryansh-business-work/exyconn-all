import type { ReactElement } from 'react';
import { createContext, useContext } from 'react';
import { Box, PickerDay, trackerActivity, useTheme } from '@exyconn/ui';
import type { PickerDayProps } from '@exyconn/ui';
import { formatDayLabel, formatHoursMinutes, type ActivityLevel } from '@exyconn/tracker-core';
import { useT } from '@exyconn/i18n';
import { selectedFill } from '../theme';

/** How much a day tracked, and how active that time was. */
export interface TrackedDate {
  level: ActivityLevel;
  trackedMs: number;
}

/**
 * The `yyyy-MM-dd` keys of the days that have tracked time, with how much and how active. Passed
 * by context rather than `slotProps.day` because MUI types that slot as exactly
 * `PickerDayProps` — smuggling an extra prop through it needs an `any` cast, which this repo bans.
 */
export const TrackedDatesContext = createContext<ReadonlyMap<string, TrackedDate>>(new Map());

/** The dot's colour, in words, so a screen reader hears what a sighted user sees. */
const DAY_NAME_TEMPLATES: Readonly<Record<ActivityLevel, string>> = {
  low: '{date}, {duration} tracked, low activity',
  medium: '{date}, {duration} tracked, medium activity',
  high: '{date}, {duration} tracked, high activity',
};

/** Local calendar key, matching the portal's timezone-bucketed `ReportDay.date`. */
export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** A round calendar cell, dotted in its activity colour when the employee tracked time. */
export default function TrackedDay({
  day,
  outsideCurrentMonth,
  ...rest
}: Readonly<PickerDayProps>): ReactElement {
  const theme = useTheme();
  const t = useT();
  const tracked = useContext(TrackedDatesContext);
  const entry = outsideCurrentMonth ? undefined : tracked.get(dateKey(day));
  const dayName =
    entry === undefined
      ? undefined
      : t(DAY_NAME_TEMPLATES[entry.level], {
          date: formatDayLabel(day),
          duration: formatHoursMinutes(entry.trackedMs),
        });

  return (
    <Box sx={{ position: 'relative' }}>
      <PickerDay
        {...rest}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        aria-label={dayName}
        sx={{
          borderRadius: '50%',
          fontWeight: 600,
          '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected:focus': selectedFill(theme),
        }}
      />
      {entry === undefined ? null : (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: 3,
            width: 5,
            height: 5,
            borderRadius: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: trackerActivity[theme.palette.mode][entry.level],
            pointerEvents: 'none',
          }}
        />
      )}
    </Box>
  );
}
