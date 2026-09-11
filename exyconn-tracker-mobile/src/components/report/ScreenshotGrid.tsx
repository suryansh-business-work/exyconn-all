import { Image } from 'expo-image';
import { Pressable } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { activityLabel, formatTimeOfDay, type DayScreenshot } from '@exyconn/tracker-core';
import { TRACKER_RADIUS, borderWidth } from '../../theme/tokens';
import { useThemeColor } from '../../theme/useThemeColor';
import { Body, Caption } from '../ui/Typography';

interface Props {
  shots: readonly DayScreenshot[];
  /** The employee's chosen zone — a capture time is an instant, so it is read in it. */
  timezone: string;
  /** Tapping any shot opens the gallery; a half-width thumbnail is no place to review them. */
  onOpen: () => void;
}

interface ThumbProps {
  shot: DayScreenshot;
  timezone: string;
  onOpen: () => void;
}

function Thumb({ shot, timezone, onOpen }: Readonly<ThumbProps>) {
  const hairline = useThemeColor('hairline');
  const capturedAt = formatTimeOfDay(shot.capturedAt, timezone);
  return (
    <YStack width="48%" gap="$1">
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Open my screenshots — this one was captured at ${capturedAt}`}
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
      <Caption numberOfLines={1}>
        {capturedAt} · {activityLabel(shot.activityPercent)}
      </Caption>
    </YStack>
  );
}

/** Thumbnails of one day's screenshots. Tapping one opens the full gallery for that day. */
export function ScreenshotGrid({ shots, timezone, onOpen }: Readonly<Props>) {
  if (shots.length === 0) {
    return (
      <Body color="$muted" textAlign="center" paddingVertical="$4">
        No screenshots on this day.
      </Body>
    );
  }

  return (
    <XStack flexWrap="wrap" justifyContent="space-between" rowGap="$3">
      {shots.map((shot) => (
        <Thumb key={shot.id} shot={shot} timezone={timezone} onOpen={onOpen} />
      ))}
    </XStack>
  );
}
