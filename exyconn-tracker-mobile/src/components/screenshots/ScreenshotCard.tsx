import { Image } from 'expo-image';
import { useRef } from 'react';
import { Pressable, type HostInstance, type View } from 'react-native';
import { XStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
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
  onOpen: (opener: HostInstance | null) => void;
}

/** One screenshot, with the activity level of its interval and the time it was captured. */
export function ScreenshotCard({ shot, timezone, width, onOpen }: Readonly<Props>) {
  const t = useT();
  const hairline = useThemeColor('hairline');
  const muted = useThemeColor('muted');
  const capturedAt = formatDateTime(shot.capturedAt, timezone);
  const thumbnail = useRef<View>(null);

  return (
    <Surface width={width} padding="$3" gap="$2.5">
      <Pressable
        ref={thumbnail}
        onPress={() => onOpen(thumbnail.current)}
        accessibilityRole="imagebutton"
        accessibilityLabel={t('Open the screenshot captured at {time} full screen', {
          time: capturedAt,
        })}
      >
        <Image
          source={{ uri: shot.imageUrl }}
          contentFit="cover"
          recyclingKey={shot.id}
          transition={150}
          accessibilityLabel={t('Screenshot captured at {time}', { time: capturedAt })}
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
              label={t("Blurred by your workspace's settings")}
            />
          ) : null}
          <Chip
            label={activityLabel(t, shot.activityPercent)}
            tone={activityColor(shot.activityPercent)}
          />
        </XStack>
      </XStack>

      <ActivityBar percent={shot.activityPercent} />
    </Surface>
  );
}
