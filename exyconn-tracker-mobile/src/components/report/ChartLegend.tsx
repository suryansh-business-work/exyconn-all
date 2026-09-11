import { XStack, YStack } from 'tamagui';
import type { ChartSeries } from '../../lib/report/charts';
import { Caption } from '../ui/Typography';

interface Props {
  series: readonly ChartSeries[];
}

const SWATCH = 10;

/** Which colour is which series. Decorative for screen readers — the table twin names them. */
export function ChartLegend({ series }: Readonly<Props>) {
  return (
    <XStack
      gap="$4"
      justifyContent="center"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {series.map((entry) => (
        <XStack key={entry.id} gap="$1.5" alignItems="center">
          <YStack width={SWATCH} height={SWATCH} borderRadius={2} backgroundColor={entry.color} />
          <Caption>{entry.label}</Caption>
        </XStack>
      ))}
    </XStack>
  );
}
