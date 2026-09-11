import type { DrawerContentComponentProps } from 'expo-router/drawer';
import * as Application from 'expo-application';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Separator, XStack, YStack } from 'tamagui';
import type { AuthUser } from '@exyconn/tracker-core';
import { NAV_ITEMS, type NavItem, type Section } from '../../navigation/sections';
import { useBrand } from '../../theme/BrandProvider';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { Icon } from '../ui/Icon';
import { Body, Caption } from '../ui/Typography';

/** "Asha Rao" → "AR"; a blank name → "?". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return `${parts[0][0]}${last}`.toUpperCase();
}

interface ItemProps {
  item: NavItem;
  selected: boolean;
  /** 0 shows no badge — which is what an empty inbox should look like. */
  count: number;
  onPress: () => void;
}

function DrawerRow({ item, selected, count, onPress }: Readonly<ItemProps>) {
  const brand = useBrand();
  const badge = count > 0 ? `, ${count} unread` : '';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityState={{ selected }}
      accessibilityLabel={`${item.label}${badge}`}
    >
      <XStack
        padding="$3"
        gap="$3"
        alignItems="center"
        borderRadius={TRACKER_RADIUS}
        backgroundColor={selected ? '$app' : 'transparent'}
      >
        <Icon name={item.icon} color={selected ? brand.primary : undefined} />
        <YStack flex={1}>
          <Body fontWeight="600">{item.label}</Body>
          <Caption>{item.caption}</Caption>
        </YStack>
        {count > 0 ? (
          <Caption color="$error" fontWeight="700">
            {count}
          </Caption>
        ) : null}
      </XStack>
    </Pressable>
  );
}

interface Props extends DrawerContentComponentProps {
  user: AuthUser | null;
  unreadMessages: number;
}

/** The drawer: who is signed in, the five sections, and the version this install runs. */
export function NavDrawer({ state, navigation, user, unreadMessages }: Readonly<Props>) {
  const insets = useSafeAreaInsets();
  const brand = useBrand();
  const current = state.routes[state.index]?.name as Section | undefined;
  const name = user?.name ?? 'Signed in';

  return (
    <YStack flex={1} backgroundColor="$paper" paddingTop={insets.top} paddingBottom={insets.bottom}>
      <XStack padding="$4" gap="$3" alignItems="center">
        <YStack
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor={brand.primary}
          alignItems="center"
          justifyContent="center"
        >
          <Body color={brand.onPrimary} fontWeight="700">
            {initials(name)}
          </Body>
        </YStack>
        <YStack flex={1}>
          <Body fontWeight="600" numberOfLines={1}>
            {name}
          </Body>
          <Caption numberOfLines={1}>{user?.email ?? ''}</Caption>
        </YStack>
      </XStack>
      <Separator borderColor="$hairline" />
      <YStack padding="$2" gap="$1" flex={1}>
        {NAV_ITEMS.map((item) => (
          <DrawerRow
            key={item.id}
            item={item}
            selected={item.id === current}
            count={item.id === 'messages' ? unreadMessages : 0}
            onPress={() => navigation.navigate(item.id)}
          />
        ))}
      </YStack>
      <Caption padding="$4">Version {Application.nativeApplicationVersion ?? '—'}</Caption>
    </YStack>
  );
}
