import { YStack, type YStackProps } from 'tamagui';
import { TRACKER_RADIUS } from '../../theme/tokens';

/**
 * A placeholder the shape of what is loading — the MUI Skeleton the desktop draws, in the
 * hairline tone so it reads as "coming", not as content. Hidden from screen readers; the
 * screen that shows it announces the load itself.
 */
export function SkeletonBlock(props: Readonly<YStackProps>) {
  return (
    <YStack
      backgroundColor="$hairline"
      borderRadius={TRACKER_RADIUS}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...props}
    />
  );
}
