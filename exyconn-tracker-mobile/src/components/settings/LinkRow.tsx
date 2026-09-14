import { Linking, Pressable } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { useBrand } from '../../theme/BrandProvider';
import { run } from '../../tracker/run';
import { Icon, type IconName } from '../ui/Icon';
import { Body, Caption } from '../ui/Typography';

interface Props {
  label: string;
  /** What is shown — the address itself, so the employee sees where the tap goes. */
  value: string;
  /** What is opened — `mailto:` for an address, the page for a site. */
  url: string;
  icon: IconName;
}

/** A labelled, tappable address that opens in the phone's own mail app or browser. */
export function LinkRow({ label, value, url, icon }: Readonly<Props>) {
  const t = useT();
  const brand = useBrand();
  return (
    <Pressable
      onPress={() => run(() => Linking.openURL(url))}
      accessibilityRole="link"
      accessibilityLabel={t('{label}: {value}', { label, value })}
    >
      <XStack gap="$3" alignItems="center" paddingVertical="$1.5">
        <Icon name={icon} color={brand.primary} />
        <YStack flex={1}>
          <Caption>{label}</Caption>
          <Body color={brand.primary} textDecorationLine="underline" numberOfLines={1}>
            {value}
          </Body>
        </YStack>
      </XStack>
    </Pressable>
  );
}
