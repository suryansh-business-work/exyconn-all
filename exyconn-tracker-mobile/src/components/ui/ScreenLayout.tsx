import { useContext, type ReactNode } from 'react';
import { RefreshControl } from 'react-native';
import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { ScrollView, YStack } from 'tamagui';
import { useThemeColor } from '../../theme/useThemeColor';

interface Props {
  children: ReactNode;
  /** Narrow screens (sign-in, consent) keep their text to a readable measure on a tablet. */
  maxWidth?: number;
  /** Pull-to-refresh, for a screen that reads the portal. */
  onRefresh?: () => void;
  refreshing?: boolean;
}

/** Room between the last card and the floating tab bar. */
const FOOT_GAP = 16;

/**
 * The scrolling page every screen sits in, padded and centred on wide screens. Transparent: the
 * root layout's ground paints behind it. Under the tab bar, its foot clears the floating bar.
 */
export function ScreenLayout({
  children,
  maxWidth,
  onRefresh,
  refreshing = false,
}: Readonly<Props>) {
  const ink = useThemeColor('ink');
  // Undefined outside the tabs (sign-in, consent), where nothing floats over the foot.
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const refresh =
    onRefresh === undefined ? undefined : (
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ink} />
    );
  return (
    <ScrollView
      flex={1}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + FOOT_GAP }}
      keyboardShouldPersistTaps="handled"
      refreshControl={refresh}
    >
      <YStack
        padding="$4"
        gap="$4"
        width="100%"
        maxWidth={maxWidth}
        alignSelf="center"
        flexGrow={1}
      >
        {children}
      </YStack>
    </ScrollView>
  );
}
