import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Stack, Typography, DateCalendar, DatePicker } from '@exyconn/ui';
import type { ReportDay } from '@shared/types';
import { activityLevel, activityPercent } from '@exyconn/tracker-core';
import Surface from './Surface';
import TrackedDay, { TrackedDatesContext } from './TrackedDay';

interface Props {
  /** The visible month's days — the dotted cells are keyed off these. */
  days: readonly ReportDay[];
  selected: Date;
  /** Today; the employee cannot look into the future. */
  maxDate: Date;
  onSelect: (date: Date) => void;
  onMonthChange: (month: Date) => void;
}

/** A jump-to-date picker, plus a month grid that dots every day with tracked time by activity. */
export default function ReportCalendar({
  days,
  selected,
  maxDate,
  onSelect,
  onMonthChange,
}: Readonly<Props>): ReactElement {
  const trackedDates = useMemo(
    () =>
      new Map(
        days
          .filter((day) => day.activeMs + day.idleMs > 0)
          .map((day) => [
            day.date.slice(0, 10),
            activityLevel(activityPercent(day.activeMs, day.idleMs)),
          ]),
      ),
    [days],
  );

  const handleChange = (date: Date | null): void => {
    if (date !== null && !Number.isNaN(date.getTime())) {
      onSelect(date);
    }
  };

  return (
    <Surface sx={{ p: 2 }}>
      <Stack spacing={1}>
        <DatePicker
          label="Jump to date"
          value={selected}
          maxDate={maxDate}
          onChange={handleChange}
          slotProps={{ textField: { fullWidth: true } }}
        />

        <TrackedDatesContext.Provider value={trackedDates}>
          <DateCalendar
            value={selected}
            maxDate={maxDate}
            onChange={handleChange}
            onMonthChange={onMonthChange}
            slots={{ day: TrackedDay }}
            sx={{ width: '100%', mx: 0 }}
          />
        </TrackedDatesContext.Provider>

        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          Dotted days have tracked time, coloured by how active they were. Pick one to see its
          screenshots.
        </Typography>
      </Stack>
    </Surface>
  );
}
