import { useMemo } from 'react';
import { XStack, YStack } from 'tamagui';
import type { ActivityLevel } from '@exyconn/tracker-core';
import { buildMonthGrid, weekdayLabels } from '../../lib/report/calendar';
import { Caption } from '../ui/Typography';
import { CalendarDay } from './CalendarDay';

interface Props {
  month: Date;
  /** `yyyy-MM-dd` → how active the day was, for the days with tracked time. */
  tracked: ReadonlyMap<string, ActivityLevel>;
  selected: Date;
  /** Today; the employee cannot look into the future. */
  maxDate: Date;
  onSelect: (date: Date) => void;
}

/** The month as weeks of day cells, under a row of weekday initials. */
export function CalendarGrid({ month, tracked, selected, maxDate, onSelect }: Readonly<Props>) {
  const weeks = useMemo(
    () => buildMonthGrid(month, { tracked, selected, maxDate }),
    [month, tracked, selected, maxDate],
  );
  const headers = weeks.length > 0 ? weekdayLabels(weeks[0]) : [];

  return (
    <YStack gap="$1">
      <XStack accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {headers.map((header) => (
          <Caption key={header.key} flex={1} textAlign="center" fontWeight="600">
            {header.label}
          </Caption>
        ))}
      </XStack>
      {weeks.map((week) => (
        <XStack key={week.key}>
          {week.cells.map((cell) => (
            <CalendarDay key={cell.key} cell={cell} onSelect={onSelect} />
          ))}
        </XStack>
      ))}
    </YStack>
  );
}
