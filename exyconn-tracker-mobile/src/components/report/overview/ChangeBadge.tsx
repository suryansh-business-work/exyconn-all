import { XStack } from 'tamagui';
import type { ChangeDirection, ChangeLabel } from '@exyconn/tracker-core';
import { useBrand } from '../../../theme/BrandProvider';
import { radius, trackerActivity } from '../../../theme/tokens';
import { useThemeColor } from '../../../theme/useThemeColor';
import { Caption } from '../../ui/Typography';

/** The tint behind the badge's text: its own hue at this alpha (two hex digits). */
const TINT = '24';

/** Up reads as the high activity hue, down as the low one; no change stays neutral. */
function hueOf(
  direction: ChangeDirection,
  hues: { low: string; high: string },
  flat: string,
): string {
  if (direction === 'up') {
    return hues.high;
  }
  return direction === 'down' ? hues.low : flat;
}

/** "+12%" in a small tinted pill beside a figure — this period against the one before. */
export function ChangeBadge({ change }: Readonly<{ change: ChangeLabel }>) {
  const { scheme } = useBrand();
  const muted = useThemeColor('muted');
  const hue = hueOf(change.direction, trackerActivity[scheme], muted);
  return (
    <XStack
      paddingHorizontal="$2"
      paddingVertical="$0.5"
      borderRadius={radius.pill}
      backgroundColor={`${hue}${TINT}`}
    >
      <Caption fontWeight="700" color={hue}>
        {change.text}
      </Caption>
    </XStack>
  );
}
