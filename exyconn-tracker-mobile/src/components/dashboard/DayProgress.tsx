import { useState } from 'react';
import { Pressable } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { formatHoursMinutes } from '@exyconn/tracker-core';
import type { ProgressStyle, WorkProfile, Workday } from '@exyconn/tracker-core';
import {
  dayFigures,
  dayProgressLabel,
  daySummary,
  dayTargetSource,
  type DayFigures,
} from '../../lib/dashboard/day-progress';
import { useBrand } from '../../theme/BrandProvider';
import { useThemeColor } from '../../theme/useThemeColor';
import { Icon } from '../ui/Icon';
import { GradientBar } from '../charts/GradientBar';
import { Body, Caption, Figure, Heading } from '../ui/Typography';
import { ProgressRing } from './ProgressRing';

interface Props {
  workday: Workday | null;
  workProfile: WorkProfile | null;
  /** Worked today INCLUDING the session in progress — the live number, not the synced one. */
  activeMs: number;
  /** Bar across the card, or a ring around the figure. The employee's own choice. */
  style: ProgressStyle;
}

interface ShapeProps {
  figures: DayFigures;
  activeMs: number;
  /** The fill: the brand accent, or the success hue once the day is done. */
  color: string;
}

/** The big figure over a gradient bar that fills towards the day's target. */
function DayProgressBar({ figures, activeMs }: Readonly<ShapeProps>) {
  return (
    <YStack gap="$3">
      <Figure>{formatHoursMinutes(activeMs)}</Figure>
      <GradientBar
        percent={figures.percent}
        label="Worked"
        trailing={`of ${formatHoursMinutes(figures.targetMs)}`}
        accessibilityLabel={dayProgressLabel(figures, activeMs)}
      />
      <Caption>{daySummary(figures)}</Caption>
    </YStack>
  );
}

/** The ring: the percentage sits inside the shape that describes it. */
function DayProgressRing({ figures, activeMs, color }: Readonly<ShapeProps>) {
  return (
    <XStack gap="$4" alignItems="center">
      <ProgressRing
        value={figures.percent}
        label={`${figures.percent}%`}
        caption={formatHoursMinutes(activeMs)}
        color={color}
      />
      <Body color="$muted" flex={1}>
        {daySummary(figures)}
      </Body>
    </XStack>
  );
}

/**
 * How much of today's contracted day is done, at the top of the tracker.
 *
 * Active time only: idle minutes are time at a desk, not time worked, and a bar that counted
 * them would fill on its own while nobody was there. The target comes from HR's employee
 * record — the info button says so (the desktop's tooltip; a phone has no hover), because an
 * employee who thinks the tracker invented their working day has no way to challenge it.
 *
 * The bar and the ring are the same number in two shapes, and which one appears is the
 * employee's own setting.
 */
export function DayProgress({ workday, workProfile, activeMs, style }: Readonly<Props>) {
  const [explained, setExplained] = useState(false);
  const brand = useBrand();
  const success = useThemeColor('success');
  const muted = useThemeColor('muted');
  const figures = dayFigures(workday, workProfile, activeMs);
  const color = figures.done ? success : brand.primary;
  const Shape = style === 'ring' ? DayProgressRing : DayProgressBar;

  return (
    <YStack gap="$2">
      <XStack justifyContent="space-between" alignItems="center" gap="$2">
        <XStack alignItems="center" gap="$1.5">
          <Body color="$muted" fontWeight="600">
            Worked today
          </Body>
          <Pressable
            onPress={() => setExplained((open) => !open)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="About your working day"
            accessibilityState={{ expanded: explained }}
          >
            <Icon name="information-outline" size={18} color={muted} />
          </Pressable>
        </XStack>
        <Heading color={color}>{figures.percent}%</Heading>
      </XStack>
      {explained ? <Caption>{dayTargetSource(figures)}</Caption> : null}
      <Shape figures={figures} activeMs={activeMs} color={color} />
    </YStack>
  );
}
