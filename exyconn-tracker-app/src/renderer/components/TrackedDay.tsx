import type { ReactElement } from 'react';
import { createContext, useContext } from 'react';
import { Box, PickerDay, trackerActivity, useTheme } from '@exyconn/ui';
import type { PickerDayProps } from '@exyconn/ui';
import type { ActivityLevel } from '@exyconn/tracker-core';
import { selectedFill } from '../theme';

/**
 * The `yyyy-MM-dd` keys of the days that have tracked time, with how active each was. Passed
 * by context rather than `slotProps.day` because MUI types that slot as exactly
 * `PickerDayProps` — smuggling an extra prop through it needs an `any` cast, which this repo bans.
 */
export const TrackedDatesContext = createContext<ReadonlyMap<string, ActivityLevel>>(new Map());

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
  const tracked = useContext(TrackedDatesContext);
  const level = outsideCurrentMonth ? undefined : tracked.get(dateKey(day));

  return (
    <Box sx={{ position: 'relative' }}>
      <PickerDay
        {...rest}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={{
          borderRadius: '50%',
          fontWeight: 600,
          '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected:focus': selectedFill(theme),
        }}
      />
      {level === undefined ? null : (
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
            backgroundColor: trackerActivity[theme.palette.mode][level],
            pointerEvents: 'none',
          }}
        />
      )}
    </Box>
  );
}
