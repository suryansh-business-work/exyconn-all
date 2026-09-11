import { YStack, type YStackProps } from 'tamagui';
import { TRACKER_RADIUS, borderWidth } from '../../theme/tokens';

/**
 * The one panel recipe the app uses: opaque paper, a hairline border, the tracker's 4px corner.
 * The desktop's surface, so a card on the phone and a card on the laptop are the same shape.
 */
export function Surface(props: Readonly<YStackProps>) {
  return (
    <YStack
      backgroundColor="$paper"
      borderColor="$hairline"
      borderWidth={borderWidth.hairline}
      borderRadius={TRACKER_RADIUS}
      padding="$4"
      gap="$3"
      {...props}
    />
  );
}
