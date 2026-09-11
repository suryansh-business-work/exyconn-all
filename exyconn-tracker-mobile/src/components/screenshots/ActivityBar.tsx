import { YStack } from 'tamagui';
import { activityColor } from '@exyconn/tracker-core';
import { useThemeColor } from '../../theme/useThemeColor';

interface Props {
  /** 0–100: how active the interval a screenshot belongs to was. */
  percent: number;
}

const HEIGHT = 4;

/** The interval's activity as a length — the desktop's determinate LinearProgress. */
export function ActivityBar({ percent }: Readonly<Props>) {
  const tone = useThemeColor(activityColor(percent));
  const filled = Math.min(100, Math.max(0, percent));
  return (
    <YStack
      height={HEIGHT}
      borderRadius={HEIGHT}
      backgroundColor="$hairline"
      overflow="hidden"
      accessibilityRole="progressbar"
      accessibilityLabel="Activity in this screenshot's interval"
      accessibilityValue={{ min: 0, max: 100, now: filled }}
    >
      <YStack width={`${filled}%`} height="100%" backgroundColor={tone} />
    </YStack>
  );
}
