import Svg, { Rect } from 'react-native-svg';
import { XStack, YStack } from 'tamagui';
import type { ActivityLevel, ChartBar } from '@exyconn/tracker-core';
import { useBrand } from '../../theme/BrandProvider';
import { trackerActivity } from '../../theme/tokens';
import { useThemeColor } from '../../theme/useThemeColor';
import { Caption } from '../ui/Typography';

/** The SVG's own coordinate width; it is stretched to the card, so only proportions matter. */
const VIEW_WIDTH = 1000;
/** The share of each slot left empty between bars, so neighbours read as separate stripes. */
const GAP = 0.3;
/** An empty or near-empty slot still draws a sliver, so "nothing here" is visibly a slot. */
const MIN_BAR = 3;

export interface AxisLabels {
  start: string;
  middle: string;
  end: string;
}

interface Props {
  bars: readonly ChartBar[];
  labels: AxisLabels;
  /** What the chart says, for a screen reader — the bars themselves are not read out. */
  summary: string;
  height?: number;
}

/**
 * Bars as thin coloured stripes, their colour the activity level: the day's intervals by time,
 * or a period's days. The desktop's chart, drawn with react-native-svg; the labels sit under it
 * as text, so stretching the SVG never distorts them.
 */
export function StripesChart({ bars, labels, summary, height = 140 }: Readonly<Props>) {
  const { scheme } = useBrand();
  const hues = trackerActivity[scheme];
  const empty = useThemeColor('hairline');
  const fill = (level: ActivityLevel | null): string => (level === null ? empty : hues[level]);

  return (
    <YStack gap="$2">
      <YStack height={height} accessible accessibilityRole="image" accessibilityLabel={summary}>
        <Svg
          width="100%"
          height={height}
          viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
          preserveAspectRatio="none"
        >
          {bars.map((bar) => {
            const slot = bar.width * VIEW_WIDTH;
            const barHeight = Math.max(bar.value * height, MIN_BAR);
            return (
              <Rect
                key={bar.key}
                x={bar.offset * VIEW_WIDTH + (slot * GAP) / 2}
                width={Math.max(slot * (1 - GAP), 2)}
                y={height - barHeight}
                height={barHeight}
                rx={2}
                fill={fill(bar.level)}
              />
            );
          })}
        </Svg>
      </YStack>
      <XStack justifyContent="space-between" accessibilityElementsHidden>
        <Caption fontWeight="600">{labels.start}</Caption>
        <Caption fontWeight="600">{labels.middle}</Caption>
        <Caption fontWeight="600">{labels.end}</Caption>
      </XStack>
    </YStack>
  );
}
