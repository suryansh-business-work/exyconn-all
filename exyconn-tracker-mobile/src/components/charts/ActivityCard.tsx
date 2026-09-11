import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { ACTIVITY_LEGEND, activityLevel } from '@exyconn/tracker-core';
import { useBrand } from '../../theme/BrandProvider';
import { trackerActivity } from '../../theme/tokens';
import { Surface } from '../ui/Surface';
import { Caption, Heading } from '../ui/Typography';

interface Props {
  title: string;
  /** The chart's headline activity, in percent; null hides it (nothing tracked yet). */
  percent: number | null;
  children: ReactNode;
}

const DOT = 8;

/** One legend entry: the level's dot and its range. */
function LegendItem({ hue, label }: Readonly<{ hue: string; label: string }>) {
  return (
    <XStack gap="$1" alignItems="center">
      <YStack width={DOT} height={DOT} borderRadius={DOT / 2} backgroundColor={hue} />
      <Caption>{label}</Caption>
    </XStack>
  );
}

/**
 * A card around an activity chart: the title, the headline percentage in its level's colour,
 * and the legend that says what each colour means — colour is never the only carrier.
 */
export function ActivityCard({ title, percent, children }: Readonly<Props>) {
  const { scheme } = useBrand();
  const hues = trackerActivity[scheme];
  return (
    <Surface>
      <YStack gap="$1">
        <XStack justifyContent="space-between" alignItems="baseline">
          <Heading>{title}</Heading>
          {percent === null ? null : (
            <Heading color={hues[activityLevel(percent)]}>{percent}%</Heading>
          )}
        </XStack>
        <XStack gap="$3" justifyContent="flex-end">
          {ACTIVITY_LEGEND.map((entry) => (
            <LegendItem key={entry.level} hue={hues[entry.level]} label={entry.label} />
          ))}
        </XStack>
      </YStack>
      {children}
    </Surface>
  );
}
