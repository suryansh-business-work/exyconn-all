import { ScrollView, XStack, YStack } from 'tamagui';
import {
  activityColor,
  activityPercent,
  formatCount,
  formatDayLabel,
  formatHoursMinutes,
  type ReportDay,
} from '@exyconn/tracker-core';
import { dayRowLabel } from '../../lib/report/totals';
import { borderWidth } from '../../theme/tokens';
import { Chip } from '../ui/Chip';
import { Surface } from '../ui/Surface';
import { Body, Caption, Heading } from '../ui/Typography';
import { SkeletonBlock } from './SkeletonBlock';

/**
 * Keys and Mouse are the PORTAL's figures for this employee across every device they track on
 * — a laptop's keystrokes land here too — so they stay, even though a phone counts neither.
 */
const COLUMNS = ['Day', 'Worked', 'Idle', 'Activity', 'Keys', 'Mouse', 'Sessions'] as const;
const SKELETON_ROWS = ['s1', 's2', 's3', 's4', 's5'] as const;
const CELL_WIDTH = 84;

interface Props {
  days: readonly ReportDay[];
  loading: boolean;
}

function Cell({ children }: Readonly<{ children: string }>) {
  return (
    <Body width={CELL_WIDTH} numberOfLines={1} fontVariant={['tabular-nums']}>
      {children}
    </Body>
  );
}

function DayRow({ day }: Readonly<{ day: ReportDay }>) {
  const percent = activityPercent(day.activeMs, day.idleMs);
  return (
    <XStack
      paddingVertical="$2"
      alignItems="center"
      borderTopWidth={borderWidth.hairline}
      borderTopColor="$hairline"
      accessible
      accessibilityLabel={dayRowLabel(day)}
    >
      <Cell>{formatDayLabel(day.date)}</Cell>
      <Cell>{formatHoursMinutes(day.activeMs)}</Cell>
      <Cell>{formatHoursMinutes(day.idleMs)}</Cell>
      <YStack width={CELL_WIDTH}>
        <Chip label={`${percent}%`} tone={activityColor(percent)} />
      </YStack>
      <Cell>{formatCount(day.keyCount)}</Cell>
      <Cell>{formatCount(day.mouseCount)}</Cell>
      <Cell>{formatCount(day.sessions)}</Cell>
    </XStack>
  );
}

/** Day-by-day table of the employee's own tracked time. Scrolls sideways on a narrow phone. */
export function ReportTable({ days, loading }: Readonly<Props>) {
  if (loading) {
    return (
      <Surface accessible accessibilityLabel="Loading your tracked days">
        {SKELETON_ROWS.map((id) => (
          <SkeletonBlock key={id} height={40} />
        ))}
      </Surface>
    );
  }

  if (days.length === 0) {
    return (
      <Surface padding="$6" alignItems="center" gap="$1">
        <Heading size="$4">No tracked time this month</Heading>
        <Body color="$muted" textAlign="center">
          Days appear here once you start tracking and sync.
        </Body>
      </Surface>
    );
  }

  return (
    <Surface padding={0}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <YStack paddingHorizontal="$3" paddingVertical="$2">
          <XStack paddingVertical="$2">
            {COLUMNS.map((column) => (
              <Caption key={column} width={CELL_WIDTH} fontWeight="700" color="$ink">
                {column}
              </Caption>
            ))}
          </XStack>
          {days.map((day) => (
            <DayRow key={day.date} day={day} />
          ))}
        </YStack>
      </ScrollView>
    </Surface>
  );
}
