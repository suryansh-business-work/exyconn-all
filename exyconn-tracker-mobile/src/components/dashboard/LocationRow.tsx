import { useRef } from 'react';
import { Pressable, type HostInstance, type View } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { locationPinParts, type TrackerLocationPin } from '@exyconn/tracker-core';
import { Icon } from '../ui/Icon';
import { Body, Caption } from '../ui/Typography';

interface Props {
  pin: TrackerLocationPin;
  timezone: string;
  /** Shows the pin on the map; the screen reader comes back to this row on close. */
  onOpen: (pin: TrackerLocationPin, opener: HostInstance | null) => void;
}

/** One pin of today: when, why it was recorded, and where the fix came from. */
export function LocationRow({ pin, timezone, onOpen }: Readonly<Props>) {
  const t = useT();
  const row = useRef<View>(null);
  const { time, kind, source } = locationPinParts(pin, timezone, t);

  return (
    <Pressable
      ref={row}
      onPress={() => onOpen(pin, row.current)}
      accessibilityRole="button"
      accessibilityLabel={`${time}, ${kind}, ${source}`}
    >
      <XStack gap="$3" paddingVertical="$2" alignItems="center">
        <Icon name={pin.kind === 'ATTENDANCE' ? 'account-check-outline' : 'map-marker-outline'} />
        <YStack flex={1} gap="$0.5">
          <Body fontWeight="600">{kind}</Body>
          <Caption>
            {time} · {source}
          </Caption>
        </YStack>
        <Icon name="chevron-right" />
      </XStack>
    </Pressable>
  );
}
