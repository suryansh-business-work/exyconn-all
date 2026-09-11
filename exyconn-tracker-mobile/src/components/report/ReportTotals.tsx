import { XStack, YStack } from 'tamagui';
import { summaries, type ReportTotals as Totals } from '../../lib/report/totals';
import { borderWidth } from '../../theme/tokens';
import { Surface } from '../ui/Surface';
import { Caption, Heading } from '../ui/Typography';

interface Props {
  totals: Totals;
}

/** The span's headline numbers — the month above its day-by-day table, or one tapped day. */
export function ReportTotals({ totals }: Readonly<Props>) {
  return (
    <Surface padding="$3">
      <XStack>
        {summaries(totals).map((item, position) => (
          <YStack
            key={item.id}
            flex={1}
            paddingHorizontal="$2"
            borderLeftWidth={position === 0 ? 0 : borderWidth.hairline}
            borderLeftColor="$hairline"
            accessible
            accessibilityLabel={`${item.label}: ${item.value}`}
          >
            <Caption numberOfLines={1}>{item.label}</Caption>
            <Heading accessibilityRole="text" numberOfLines={1} adjustsFontSizeToFit>
              {item.value}
            </Heading>
          </YStack>
        ))}
      </XStack>
    </Surface>
  );
}
