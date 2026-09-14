import type { RefObject } from 'react';
import { Pressable, type Text } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { activityColor, activityLabel, formatCount } from '@exyconn/tracker-core';
import { useStatusMessage } from '../../hooks/useStatusMessage';
import { Chip } from '../ui/Chip';
import { Icon, type IconName } from '../ui/Icon';
import { Body, Caption } from '../ui/Typography';

interface TopProps {
  /** Where the screen reader starts when the viewer opens. */
  titleRef: RefObject<Text | null>;
  /** "Mon 3 Feb, 10:42 AM" — already read in the employee's zone. */
  capturedAt: string;
  activityPercent: number;
  blurred: boolean;
  onClose: () => void;
}

/** When the shot was taken, how active its interval was, whether it was blurred — and close. */
export function LightboxTopBar({
  titleRef,
  capturedAt,
  activityPercent,
  blurred,
  onClose,
}: Readonly<TopProps>) {
  const t = useT();
  return (
    <XStack paddingHorizontal="$3" paddingVertical="$2" gap="$2" alignItems="center">
      <YStack flex={1} gap="$1.5">
        <Body ref={titleRef} numberOfLines={1}>
          {capturedAt}
        </Body>
        <XStack gap="$2">
          <Chip label={activityLabel(t, activityPercent)} tone={activityColor(activityPercent)} />
          {blurred ? <Chip label={t('Blurred')} icon="blur" /> : null}
        </XStack>
      </YStack>
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t('Close')}
      >
        <Icon name="close" size={28} />
      </Pressable>
    </XStack>
  );
}

interface StepProps {
  label: string;
  icon: IconName;
  onPress: () => void;
}

function StepButton({ label, icon, onPress }: Readonly<StepProps>) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}>
      <XStack alignItems="center" gap="$1" padding="$2">
        {icon === 'chevron-left' ? <Icon name={icon} size={26} /> : null}
        <Body>{label}</Body>
        {icon === 'chevron-right' ? <Icon name={icon} size={26} /> : null}
      </XStack>
    </Pressable>
  );
}

interface NavProps {
  /** 0-based position of the shot on screen. */
  index: number;
  total: number;
  onStep: (delta: number) => void;
}

/** Previous / next through the day, with where in it this shot sits. Wraps at both ends. */
export function LightboxNav({ index, total, onStep }: Readonly<NavProps>) {
  const t = useT();
  const position = `${formatCount(index + 1)} / ${formatCount(total)}`;
  const live = useStatusMessage(position);
  return (
    <XStack
      paddingHorizontal="$3"
      paddingVertical="$2"
      alignItems="center"
      justifyContent="space-between"
    >
      <StepButton label={t('Previous')} icon="chevron-left" onPress={() => onStep(-1)} />
      <Caption {...live}>{position}</Caption>
      <StepButton label={t('Next')} icon="chevron-right" onPress={() => onStep(1)} />
    </XStack>
  );
}
