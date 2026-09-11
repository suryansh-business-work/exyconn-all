import { Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack } from 'tamagui';
import { useUpdateState } from '../../hooks/useUpdateState';
import { useBrand } from '../../theme/BrandProvider';
import { run } from '../../tracker/run';
import { openUpdate } from '../../tracker/updates';
import { Icon } from '../ui/Icon';
import { Caption } from '../ui/Typography';

/**
 * A strip at the very top when a newer build exists. It only ever announces — installing is
 * the OS's job — and it says which version, so "update" is never a vague nag.
 */
export function UpdateBanner() {
  const update = useUpdateState();
  const brand = useBrand();
  const insets = useSafeAreaInsets();

  if (update.stage !== 'available') {
    return null;
  }
  const action = Platform.OS === 'android' ? 'Download' : 'Details';
  return (
    <XStack
      backgroundColor={brand.primary}
      paddingTop={insets.top + 4}
      paddingBottom="$2"
      paddingHorizontal="$3"
      gap="$2"
      alignItems="center"
      accessibilityRole="alert"
    >
      <Icon name="download-circle-outline" color={brand.onPrimary} />
      <Caption flex={1} color={brand.onPrimary} fontWeight="600">
        Exyconn Tracker {update.version} is available.
      </Caption>
      <Pressable onPress={() => run(openUpdate)} accessibilityRole="link" hitSlop={8}>
        <Caption color={brand.onPrimary} fontWeight="700" textDecorationLine="underline">
          {action}
        </Caption>
      </Pressable>
    </XStack>
  );
}
