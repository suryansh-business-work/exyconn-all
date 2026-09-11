import type { ReactNode } from 'react';
import { RefreshControl } from 'react-native';
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

/** The scrolling page every screen sits in: the app ground, padded, centred on wide screens. */
export function ScreenLayout({
  children,
  maxWidth,
  onRefresh,
  refreshing = false,
}: Readonly<Props>) {
  const ink = useThemeColor('ink');
  const refresh =
    onRefresh === undefined ? undefined : (
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ink} />
    );
  return (
    <ScrollView
      flex={1}
      backgroundColor="$app"
      contentContainerStyle={{ flexGrow: 1 }}
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
