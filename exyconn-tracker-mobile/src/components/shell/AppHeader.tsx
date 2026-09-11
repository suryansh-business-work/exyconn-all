import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack } from 'tamagui';
import type { TrackerStatus } from '@exyconn/tracker-core';
import { BrandMark } from '../ui/BrandMark';
import { Icon } from '../ui/Icon';
import { Caption } from '../ui/Typography';
import { TrackingPulse } from './TrackingPulse';

interface Props {
  title: string;
  /** Drives the recording indicator — on every page, not just the dashboard. */
  status: TrackerStatus;
  onOpenMenu: () => void;
}

/** Compact top bar: the menu, the brand, the section, and the recording indicator. */
export function AppHeader({ title, status, onOpenMenu }: Readonly<Props>) {
  const insets = useSafeAreaInsets();
  return (
    <XStack
      backgroundColor="$paper"
      borderBottomWidth={1}
      borderBottomColor="$hairline"
      paddingTop={insets.top + 6}
      paddingBottom="$2"
      paddingHorizontal="$3"
      gap="$3"
      alignItems="center"
    >
      <Pressable
        onPress={onOpenMenu}
        accessibilityRole="button"
        accessibilityLabel="Open navigation"
        hitSlop={12}
      >
        <Icon name="menu" size={24} />
      </Pressable>
      <BrandMark height={22} />
      <Caption flex={1} textAlign="right" fontWeight="600" numberOfLines={1}>
        {title}
      </Caption>
      <TrackingPulse status={status} />
    </XStack>
  );
}
