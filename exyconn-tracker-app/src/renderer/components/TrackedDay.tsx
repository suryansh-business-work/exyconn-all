import type { ReactElement } from 'react';
import { createContext, useContext } from 'react';
import { Badge, PickerDay, TRACKER_RADIUS } from '@exyconn/ui';
import type { PickerDayProps } from '@exyconn/ui';
/**
 * The `yyyy-MM-dd` keys of the days that have tracked time. Passed by context rather than
 * `slotProps.day` because MUI types that slot as exactly `PickerDayProps` — smuggling an
 * extra prop through it needs an `any` cast, which this repo bans.
 */
export const TrackedDatesContext = createContext<ReadonlySet<string>>(new Set<string>());

/** Local calendar key, matching the portal's timezone-bucketed `ReportDay.date`. */
export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** A calendar cell, dotted when the employee tracked time that day. */
export default function TrackedDay({
  day,
  outsideCurrentMonth,
  ...rest
}: Readonly<PickerDayProps<Date>>): ReactElement {
  const tracked = useContext(TrackedDatesContext);
  const isTracked = !outsideCurrentMonth && tracked.has(dateKey(day));

  return (
    <Badge
      overlap="circular"
      color="secondary"
      variant="dot"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      invisible={!isTracked}
    >
      <PickerDay
        {...rest}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={{ borderRadius: `${TRACKER_RADIUS}px` }}
      />
    </Badge>
  );
}
