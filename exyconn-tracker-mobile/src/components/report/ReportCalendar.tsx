import { useMemo } from 'react';
import type { ReportDay } from '@exyconn/tracker-core';
import { trackedDateLevels } from '../../lib/report/calendar';
import { canGoForward } from '../../lib/report/month';
import { Surface } from '../ui/Surface';
import { Caption } from '../ui/Typography';
import { CalendarGrid } from './CalendarGrid';
import { JumpToDate } from './JumpToDate';
import { MonthSwitcher } from './MonthSwitcher';

interface Props {
  /** The visible month's days — the dotted cells are keyed off these. */
  days: readonly ReportDay[];
  /** The month on show. */
  month: Date;
  selected: Date;
  /** Today; the employee cannot look into the future. */
  maxDate: Date;
  onSelect: (date: Date) => void;
  onMonthChange: (month: Date) => void;
}

/** A jump-to-date picker, plus a month grid that dots every day with tracked time by activity. */
export function ReportCalendar({
  days,
  month,
  selected,
  maxDate,
  onSelect,
  onMonthChange,
}: Readonly<Props>) {
  const tracked = useMemo(() => trackedDateLevels(days), [days]);

  return (
    <Surface>
      <JumpToDate selected={selected} maxDate={maxDate} onSelect={onSelect} />
      <MonthSwitcher
        month={month}
        canGoForward={canGoForward(month, maxDate)}
        onChange={onMonthChange}
      />
      <CalendarGrid
        month={month}
        tracked={tracked}
        selected={selected}
        maxDate={maxDate}
        onSelect={onSelect}
      />
      <Caption textAlign="center">
        Dotted days have tracked time, coloured by how active they were. Tap one to see its
        screenshots.
      </Caption>
    </Surface>
  );
}
