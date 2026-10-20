import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { CircularProgress, Stack, Typography, DateCalendar, DatePicker } from '@exyconn/ui';
import type { ReportDay } from '@shared/types';
import type { DayMark } from '@exyconn/tracker-core';
import { activityLevel, activityPercent } from '@exyconn/tracker-core';
import { useT } from '@exyconn/i18n';
import Surface from './Surface';
import CalendarLegend from './CalendarLegend';
import TrackedDay, { DayLabelsContext, DayMarksContext, TrackedDatesContext } from './TrackedDay';

interface Props {
  /** The visible month's days — the dotted cells are keyed off these. */
  days: readonly ReportDay[];
  /** The month's days are still on their way, so the dots are not drawn yet. */
  loading: boolean;
  /** Leave, holidays, week offs and finished days short of the contract, ringed on the grid. */
  marks?: ReadonlyMap<string, DayMark>;
  /** What each off day is called — the leave code (CL, EL) or the holiday's name. */
  labels?: ReadonlyMap<string, string>;
  selected: Date;
  /** Today; the employee cannot look into the future. */
  maxDate: Date;
  onSelect: (date: Date) => void;
  onMonthChange: (month: Date) => void;
}

const NO_MARKS: ReadonlyMap<string, DayMark> = new Map();
const NO_LABELS: ReadonlyMap<string, string> = new Map();

/** A jump-to-date picker, plus a month grid that dots every day with tracked time by activity. */
export default function ReportCalendar({
  days,
  loading,
  marks = NO_MARKS,
  labels = NO_LABELS,
  selected,
  maxDate,
  onSelect,
  onMonthChange,
}: Readonly<Props>): ReactElement {
  const t = useT();
  const trackedDates = useMemo(
    () =>
      new Map(
        days
          .filter((day) => day.activeMs + day.idleMs > 0)
          .map((day) => [
            day.date.slice(0, 10),
            {
              level: activityLevel(activityPercent(day.activeMs, day.idleMs)),
              trackedMs: day.activeMs + day.idleMs,
            },
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
          label={t('Jump to date')}
          value={selected}
          maxDate={maxDate}
          onChange={handleChange}
          slotProps={{ textField: { fullWidth: true } }}
        />

        <TrackedDatesContext.Provider value={trackedDates}>
          <DayMarksContext.Provider value={marks}>
            <DayLabelsContext.Provider value={labels}>
              <DateCalendar
                value={selected}
                maxDate={maxDate}
                onChange={handleChange}
                onMonthChange={onMonthChange}
                slots={{ day: TrackedDay }}
                sx={{ width: '100%', mx: 0 }}
              />
            </DayLabelsContext.Provider>
          </DayMarksContext.Provider>
        </TrackedDatesContext.Provider>
        <CalendarLegend />

        {loading ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', justifyContent: 'center' }}
          >
            <CircularProgress size={14} aria-hidden />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('Loading your tracked days…')}
            </Typography>
          </Stack>
        ) : (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            {t(
              'Dotted days have tracked time, coloured by how active they were. Pick one to see its screenshots.',
            )}
          </Typography>
        )}
      </Stack>
    </Surface>
  );
}
