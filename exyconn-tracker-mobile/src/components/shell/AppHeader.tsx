import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { initials, type AuthUser, type ThemeMode, type TrackerStatus } from '@exyconn/tracker-core';
import { useBrand } from '../../theme/BrandProvider';
import { BrandMark } from '../ui/BrandMark';
import { RoundButton } from '../ui/RoundButton';
import { Body, Display } from '../ui/Typography';
import { ThemeToggle } from './ThemeToggle';
import { TrackingPulse } from './TrackingPulse';

interface Props {
  title: string;
  /** Drives the recording indicator — on every page, not just the dashboard. */
  status: TrackerStatus;
  user: AuthUser | null;
  themeMode: ThemeMode;
  /** The avatar opens Settings, where the account and signing out live. */
  onOpenAccount: () => void;
}

/**
 * The top of every page: the brand and the recording indicator, then the page's big title with
 * the theme switch and the signed-in employee beside it. It sits on the app's ground, so a
 * transparent background shows behind it too.
 */
export function AppHeader({ title, status, user, themeMode, onOpenAccount }: Readonly<Props>) {
  const insets = useSafeAreaInsets();
  const brand = useBrand();
  const name = user?.name ?? 'Signed in';
  return (
    <YStack paddingTop={insets.top + 6} paddingHorizontal="$4" paddingBottom="$2" gap="$2">
      <XStack alignItems="center" gap="$3">
        <XStack flex={1}>
          <BrandMark height={20} />
        </XStack>
        <TrackingPulse status={status} />
      </XStack>
      <XStack alignItems="center" gap="$2">
        <Display flex={1} numberOfLines={1}>
          {title}
        </Display>
        <ThemeToggle mode={themeMode} round />
        <RoundButton label={`${name}, open settings`} onPress={onOpenAccount} fill={brand.primary}>
          <Body fontWeight="700" color={brand.onPrimary}>
            {initials(name)}
          </Body>
        </RoundButton>
      </XStack>
    </YStack>
  );
}
