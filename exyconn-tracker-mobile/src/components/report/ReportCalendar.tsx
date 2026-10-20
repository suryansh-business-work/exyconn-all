import { useMemo } from 'react';
import { Spinner, XStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import type { DayMark, ReportDay } from '@exyconn/tracker-core';
import { useMarkColors } from '../../hooks/useMarkColors';
import { trackedDateLevels } from '../../lib/report/calendar';
import { canGoForward } from '../../lib/report/month';
import { Surface } from '../ui/Surface';
import { Caption } from '../ui/Typography';
import { CalendarGrid } from './CalendarGrid';
import { CalendarLegend } from './CalendarLegend';
import { JumpToDate } from './JumpToDate';
import { MonthSwitcher } from './MonthSwitcher';

interface Props {
  /** The visible month's days — the dotted cells are keyed off these. */
  days: readonly ReportDay[];
  /** The month's days are still on their way, so the dots are not drawn yet. */
  loading: boolean;
  /** Leave, holidays, the week off and finished days short of the contract, by `yyyy-MM-dd`. */
  marks: ReadonlyMap<string, DayMark>;
  /** The leave code or holiday name of the marked days that have one, by `yyyy-MM-dd`. */
  labels: ReadonlyMap<string, string>;
  /** The month on show. */
  month: Date;
  selected: Date;
  /** Today; the employee cannot look into the future. */
  maxDate: Date;
  onSelect: (date: Date) => void;
  onMonthChange: (month: Date) => void;
}

/**
 * A jump-to-date picker, plus a month grid that dots every day with tracked time by activity
 * and rings the days measured against the contract, with a legend for the rings.
 */
export function ReportCalendar({
  days,
  loading,
  marks,
  labels,
  month,
  selected,
  maxDate,
  onSelect,
  onMonthChange,
}: Readonly<Props>) {
  const t = useT();
  const tracked = useMemo(() => trackedDateLevels(days), [days]);
  // Once, here: the grid's rings and the legend's swatches are the same colours.
  const markColors = useMarkColors();

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
        marks={marks}
        labels={labels}
        markColors={markColors}
        selected={selected}
        maxDate={maxDate}
        onSelect={onSelect}
      />
      <CalendarLegend markColors={markColors} />
      {loading ? (
        <XStack gap="$2" alignItems="center" justifyContent="center">
          <Spinner size="small" accessibilityElementsHidden />
          <Caption>{t('Loading your tracked days…')}</Caption>
        </XStack>
      ) : (
        <Caption textAlign="center">
          {t(
            'Dotted days have tracked time, coloured by how active they were. Tap one to see its screenshots.',
          )}
        </Caption>
      )}
    </Surface>
  );
}
