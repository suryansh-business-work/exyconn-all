import { Image } from 'expo-image';
import { Pressable } from 'react-native';
import { XStack } from 'tamagui';
import {
  activityColor,
  activityLabel,
  formatDateTime,
  type DayScreenshot,
} from '@exyconn/tracker-core';
import { TRACKER_RADIUS, borderWidth } from '../../theme/tokens';
import { useThemeColor } from '../../theme/useThemeColor';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { Surface } from '../ui/Surface';
import { Body } from '../ui/Typography';
import { ActivityBar } from './ActivityBar';

interface Props {
  shot: DayScreenshot;
  timezone: string;
  /** The card's width in the grid — the image keeps its 16:10 shape inside it. */
  width: number;
  /** Opens this shot full screen — a thumbnail shows that it exists, not what it caught. */
  onOpen: () => void;
}

/** One screenshot, with the activity level of its interval and the time it was captured. */
export function ScreenshotCard({ shot, timezone, width, onOpen }: Readonly<Props>) {
  const hairline = useThemeColor('hairline');
  const muted = useThemeColor('muted');
  const capturedAt = formatDateTime(shot.capturedAt, timezone);

  return (
    <Surface width={width} padding="$3" gap="$2.5">
      <Pressable
        onPress={onOpen}
        accessibilityRole="imagebutton"
        accessibilityLabel={`Open the screenshot captured at ${capturedAt} full screen`}
      >
        <Image
          source={{ uri: shot.imageUrl }}
          contentFit="cover"
          recyclingKey={shot.id}
          transition={150}
          accessibilityLabel={`Screenshot captured at ${capturedAt}`}
          style={{
            width: '100%',
            aspectRatio: 16 / 10,
            borderRadius: TRACKER_RADIUS,
            borderWidth: borderWidth.hairline,
            borderColor: hairline,
          }}
        />
      </Pressable>

      <XStack alignItems="center" justifyContent="space-between" gap="$2">
        <Body flex={1} numberOfLines={1}>
          {capturedAt}
        </Body>
        <XStack alignItems="center" gap="$1.5">
          {shot.blurred ? (
            <Icon
              name="blur"
              size={18}
              color={muted}
              label="Blurred by your workspace's settings"
            />
          ) : null}
          <Chip
            label={activityLabel(shot.activityPercent)}
            tone={activityColor(shot.activityPercent)}
          />
        </XStack>
      </XStack>

      <ActivityBar percent={shot.activityPercent} />
    </Surface>
  );
}
