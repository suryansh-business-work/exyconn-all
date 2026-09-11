import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { formatDayInZone, offsetLabel } from '@exyconn/tracker-core';
import type { DayRange } from '../../lib/screenshots/gallery-day';
import { borderWidth } from '../../theme/tokens';
import { useThemeColor } from '../../theme/useThemeColor';
import { Icon, type IconName } from '../ui/Icon';
import { Caption, Heading } from '../ui/Typography';

interface Props {
  /** The day on show, or null when the link that opened the gallery named none. */
  range: DayRange | null;
  timezone: string;
  /** The next day has begun — there is nothing to page into before it has. */
  hasNext: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

interface DayStepProps {
  label: string;
  icon: IconName;
  disabled: boolean;
  onPress: () => void;
}

function DayStep({ label, icon, disabled, onPress }: Readonly<DayStepProps>) {
  const muted = useThemeColor('muted');
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Icon name={icon} size={28} color={disabled ? muted : undefined} />
    </Pressable>
  );
}

/**
 * "My screenshots", the day, and the zone every time below is read in — the two things an
 * employee is owed about a photograph of their screen are when it was taken and how active the
 * interval was, and "when" means nothing without the zone it is written in.
 */
export function GalleryHeader({
  range,
  timezone,
  hasNext,
  onClose,
  onPrevious,
  onNext,
}: Readonly<Props>) {
  const insets = useSafeAreaInsets();
  const zone = `times shown in ${timezone} (${offsetLabel(timezone)})`;
  const subtitle = range === null ? zone : `${formatDayInZone(range.startISO, timezone)} · ${zone}`;

  return (
    <YStack
      backgroundColor="$paper"
      borderBottomWidth={borderWidth.hairline}
      borderBottomColor="$hairline"
      paddingTop={insets.top + 6}
      paddingBottom="$2"
      paddingHorizontal="$3"
      gap="$2"
    >
      <XStack alignItems="center" gap="$3">
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close my screenshots"
        >
          <Icon name="close" size={24} />
        </Pressable>
        <Heading flex={1}>My screenshots</Heading>
      </XStack>
      <XStack alignItems="center" gap="$2">
        <DayStep
          label="Previous day"
          icon="chevron-left"
          disabled={range === null}
          onPress={onPrevious}
        />
        <Caption flex={1} textAlign="center" accessibilityLiveRegion="polite">
          {subtitle}
        </Caption>
        <DayStep label="Next day" icon="chevron-right" disabled={!hasNext} onPress={onNext} />
      </XStack>
    </YStack>
  );
}
