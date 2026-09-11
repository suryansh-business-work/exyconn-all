import { useContext, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { BottomTabBarHeightCallbackContext, type BottomTabBarProps } from 'expo-router/tabs';
import { XStack } from 'tamagui';
import { useKeyboardOpen } from '../../hooks/useKeyboardOpen';
import { NAV_ITEMS, type NavItem, type Section } from '../../navigation/sections';
import { useBrand } from '../../theme/BrandProvider';
import { CHROME, SCRIM } from '../../theme/palette';
import { radius, trackerSelected, trackerTabBar } from '../../theme/tokens';
import { Icon } from '../ui/Icon';
import { Body } from '../ui/Typography';

/** Gap between the bar and the bottom safe area. */
const FLOAT = 12;
const UNREAD_DOT = 8;

const BY_ID = new Map(NAV_ITEMS.map((item) => [item.id, item]));

/** On the dark bar the selected pill is light, and the idle icons are the dark chrome's muted. */
const PILL = trackerSelected.dark;
const IDLE_ICON = CHROME.dark.muted;

interface TabProps {
  item: NavItem;
  selected: boolean;
  count: number;
  onPress: () => void;
}

/** One tab: an icon, or — selected — a light pill with the icon and its short name. */
function Tab({ item, selected, count, onPress }: Readonly<TabProps>) {
  const unread = count > 0 ? `, ${count} unread` : '';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${item.label}${unread}`}
    >
      <XStack
        height={44}
        minWidth={44}
        paddingHorizontal={selected ? '$3.5' : '$2.5'}
        gap="$1.5"
        alignItems="center"
        justifyContent="center"
        borderRadius={radius.pill}
        backgroundColor={selected ? PILL.fill : 'transparent'}
      >
        <Icon name={item.icon} size={22} color={selected ? PILL.ink : IDLE_ICON} />
        {selected ? (
          <Body size="$3" fontWeight="600" color={PILL.ink} numberOfLines={1}>
            {item.short}
          </Body>
        ) : null}
        {count > 0 && !selected ? (
          <XStack
            position="absolute"
            top={8}
            right={8}
            width={UNREAD_DOT}
            height={UNREAD_DOT}
            borderRadius={UNREAD_DOT / 2}
            backgroundColor="$error"
          />
        ) : null}
      </XStack>
    </Pressable>
  );
}

interface Props extends BottomTabBarProps {
  unreadMessages: number;
}

/**
 * The floating pill of the five sections, above the bottom safe area. It floats over the
 * screens, so it reports its real height to the navigator — screens pad their foot by it. It
 * steps aside while the keyboard is up, which would otherwise lift it over the message composer.
 */
export function TabBar({ state, navigation, insets, unreadMessages }: Readonly<Props>) {
  const { scheme } = useBrand();
  const reportHeight = useContext(BottomTabBarHeightCallbackContext);
  const keyboardOpen = useKeyboardOpen();
  const bottom = insets.bottom + FLOAT;

  useEffect(() => {
    if (keyboardOpen) {
      reportHeight?.(0);
    }
  }, [keyboardOpen, reportHeight]);

  if (keyboardOpen) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom, alignItems: 'center' }}
      onLayout={(event) => reportHeight?.(event.nativeEvent.layout.height + bottom)}
    >
      <XStack
        accessibilityRole="tablist"
        padding="$1.5"
        gap="$1"
        borderRadius={radius.pill}
        backgroundColor={trackerTabBar[scheme]}
        elevation={8}
        shadowColor={SCRIM}
        shadowOpacity={0.35}
        shadowRadius={16}
        shadowOffset={{ width: 0, height: 8 }}
      >
        {state.routes.map((route, index) => {
          const item = BY_ID.get(route.name as Section);
          if (item === undefined) {
            return null;
          }
          const selected = state.index === index;
          const onPress = (): void => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!selected && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };
          return (
            <Tab
              key={route.key}
              item={item}
              selected={selected}
              count={item.id === 'messages' ? unreadMessages : 0}
              onPress={onPress}
            />
          );
        })}
      </XStack>
    </View>
  );
}
